import Module from 'Main/Parser/Module';

const debug = false;

// Requires: Combatants
class Buffs extends Module {
  on_combatantinfo(event) {
    event.auras.forEach(aura => {
      this.applyActiveBuff({
        ability: {
          abilityIcon: aura.icon,
          guid: aura.ability,
        },
        sourceID: aura.source,
        targetID: event.sourceID,
        timestamp: event.timestamp,
      });
    });
  }
  on_applybuff(event) {
    this.applyActiveBuff(event);
  }
  // We don't store/use durations, so refreshing buff is useless. Removing the buff actually interferes with the `minimalActiveTime` parameter of `getBuff`.
  // on_refreshbuff(event) {
  //   this.removeActiveBuff(event);
  //   this.applyActiveBuff(event);
  // }
  on_removebuff(event) {
    this.removeActiveBuff(event);
  }
  on_removebuffstack(buff) {
    const targetId = buff.targetID;
    const combatant = this.owner.combatants.players[targetId];
    if (!combatant) {
      return; // a pet or something probably, either way we don't care.
    }
    // In the case of Maraad's Dying Breath it calls a `removebuffstack` that removes all additional stacks from the buff before it calls a `removebuff`, with this we can find the amount of stacks it had. The `buff.stacks` only includes the amount of removed stacks, which (at least for Maraad's) are all stacks minus one since the original buff is also considered a stack.
    const existingBuff = combatant.buffs.find(item => item.ability.guid === buff.ability.guid && item.end === null);
    existingBuff.stacks = buff.stack + 1;
  }

  applyActiveBuff(buff) {
    const targetId = buff.targetID;
    const combatant = this.owner.combatants.players[targetId];
    if (!combatant) {
      return; // a pet or something probably, either way we don't care.
    }

    if (debug) {
      const secondsIntoFight = (buff.timestamp - this.owner.fight.start_time) / 1000;
      console.log(secondsIntoFight, buff.timestamp, `Apply buff ${buff.ability.name} to ${combatant.name}`);
    }

    combatant.buffs.push({
      ...buff,
      start: buff.timestamp,
      end: null,
    });
  }
  removeActiveBuff(buff) {
    const targetId = buff.targetID;
    const combatant = this.owner.combatants.players[targetId];
    if (!combatant) {
      return; // a pet or something probably, either way we don't care.
    }

    if (debug) {
      const secondsIntoFight = (buff.timestamp - this.owner.fight.start_time) / 1000;
      console.log(secondsIntoFight, buff.timestamp, `Remove buff ${buff.ability.name} from ${combatant.name}`);
    }

    const existingBuff = combatant.buffs.find(item => item.ability.guid === buff.ability.guid && item.end === null);
    if (existingBuff) {
      existingBuff.end = buff.timestamp;
    } else {
      combatant.buffs.push({
        ...buff,
        start: this.owner.fight.start_time,
        end: buff.timestamp,
      });
    }
  }
}

export default Buffs;
