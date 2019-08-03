import { readFileSync, writeFileSync } from "fs";

export default class amiibo {
  binary: Buffer;
  dataChunk: Buffer;
  path: string;
  constructor(path: string) {
    this.path = path;
    this.binary = readFileSync(path);
    this.dataChunk = this.binary.slice(0xE0, 0x1B4);
  }

  debug(offset: number, pattern: number[]) {
    this.dataChunk.fill(0);
    for (const [i, value] of pattern.entries()) {
      this.dataChunk[offset + i] = value;
      if (i > this.dataChunk.length) break;
    }
  }

  // 0xEC, 0xED, 0xEE
  get ability1(): ABILITY { return this.dataChunk.readUInt8(0x0C) }
  set ability1(v: ABILITY) { this.dataChunk.writeUInt8(v, 0x0C) }
  get ability2(): ABILITY { return this.dataChunk.readUInt8(0x0D) }
  set ability2(v: ABILITY) { this.dataChunk.writeUInt8(v, 0x0D) }
  get ability3(): ABILITY { return this.dataChunk.readUInt8(0x0E) }
  set ability3(v: ABILITY) { this.dataChunk.writeUInt8(v, 0x0E) }

  // 0x14C
  get lvExp(): number { return this.dataChunk.readUInt16LE(0x6C) }
  set lvExp(v: number) { this.dataChunk.writeUInt16LE(v, 0x6C) }

  // 0x14E
  get cpuExp(): number { return this.dataChunk.readUInt16LE(0x6E) }
  set cpuExp(v: number) { this.dataChunk.writeUInt16LE(v, 0x6E) }

  // 0x150
  get attack(): number { return this.dataChunk.readInt16LE(0x70) }
  set attack(v: number) { this.dataChunk.writeInt16LE(v, 0x70) }

  // 0x152
  get defense(): number { return this.dataChunk.readInt16LE(0x72) }
  set defense(v: number) { this.dataChunk.writeInt16LE(v, 0x72) }

  // 0x156
  get gift(): number { return this.dataChunk.readUInt16LE(0x76) }
  set gift(v: number) { this.dataChunk.writeUInt16LE(v, 0x76) }

  // 0x168
  get personality(): Buffer { return this.dataChunk.slice(0x88, 0xC2) }
  set personality(v: Buffer) { v.copy(this.dataChunk.slice(0x88, 0xC2))  }

  // 0x181
  get tauntUsage(): number { return this.personality.readUInt8(0x19) }
  set tauntUsage(v: number) { this.personality.writeUInt8(v, 0x19) }

  // ...

  // 0x188
  get jabUsage(): number { return this.personality.readUInt8(0x20) }
  set jabUsage(v: number) { this.personality.writeUInt8(v, 0x20) }
  // 0x189
  get forwardTiltUsage(): number { return this.personality.readUInt8(0x21) }
  set forwardTiltUsage(v: number) { this.personality.writeUInt8(v, 0x21) }
  // 0x18a
  get upTiltUsage(): number { return this.personality.readUInt8(0x22) }
  set upTiltUsage(v: number) { this.personality.writeUInt8(v, 0x22) }
  // 0x18b
  get upTiltUsage2(): number { return this.personality.readUInt8(0x23) }
  set upTiltUsage2(v: number) { this.personality.writeUInt8(v, 0x23) }
  // 0x18c
  get downTiltUsage(): number { return this.personality.readUInt8(0x24) }
  set downTiltUsage(v: number) { this.personality.writeUInt8(v, 0x24) }
  // 0x18d
  get forwardSmashUsage(): number { return this.personality.readUInt8(0x25) }
  set forwardSmashUsage(v: number) { this.personality.writeUInt8(v, 0x25) }
  // 0x18e
  get upSmashUsage(): number { return this.personality.readUInt8(0x26) }
  set upSmashUsage(v: number) { this.personality.writeUInt8(v, 0x26) }
  // 0x18f
  get downSmashUsage(): number { return this.personality.readUInt8(0x27) }
  set downSmashUsage(v: number) { this.personality.writeUInt8(v, 0x27) }
  // 0x190
  get downSmashNeutralSpecialUsage(): number { return this.personality.readUInt8(0x28) }
  set downSmashNeutralSpecialUsage(v: number) { this.personality.writeUInt8(v, 0x28) }
  // 0x191
  get groundedNeutralSpecialUsage(): number { return this.personality.readUInt8(0x29) }
  set groundedNeutralSpecialUsage(v: number) { this.personality.writeUInt8(v, 0x29) }
  // 0x192
  get groundedSideSpecialUsage(): number { return this.personality.readUInt8(0x2a) }
  set groundedSideSpecialUsage(v: number) { this.personality.writeUInt8(v, 0x2a) }
  // 0x193
  get groundedUpSpecialUsage(): number { return this.personality.readUInt8(0x2b) }
  set groundedUpSpecialUsage(v: number) { this.personality.writeUInt8(v, 0x2b) }
  // 0x194
  get groundedDownSpecialUsage(): number { return this.personality.readUInt8(0x2c) }
  set groundedDownSpecialUsage(v: number) { this.personality.writeUInt8(v, 0x2c) }
  // 0x195
  get upSpecialUsage2(): number { return this.personality.readUInt8(0x2d) }
  set upSpecialUsage2(v: number) { this.personality.writeUInt8(v, 0x2d) }
  // 0x196
  get forwardAerialUsage(): number { return this.personality.readUInt8(0x2e) }
  set forwardAerialUsage(v: number) { this.personality.writeUInt8(v, 0x2e) }
  // 0x197
  get backAerialUsage(): number { return this.personality.readUInt8(0x2f) }
  set backAerialUsage(v: number) { this.personality.writeUInt8(v, 0x2f) }
  // 0x198
  get upAerialUsage(): number { return this.personality.readUInt8(0x30) }
  set upAerialUsage(v: number) { this.personality.writeUInt8(v, 0x30) }
  // 0x199
  get downAerialUsage(): number { return this.personality.readUInt8(0x31) }
  set downAerialUsage(v: number) { this.personality.writeUInt8(v, 0x31) }
  // 0x19a
  get aerialNeutralSpecialUsage(): number { return this.personality.readUInt8(0x32) }
  set aerialNeutralSpecialUsage(v: number) { this.personality.writeUInt8(v, 0x32) }
  // 0x19b
  get aerialSideSpecialUsage(): number { return this.personality.readUInt8(0x33) }
  set aerialSideSpecialUsage(v: number) { this.personality.writeUInt8(v, 0x33) }
  // 0x19c
  get aerialUpSpecialUsage(): number { return this.personality.readUInt8(0x34) }
  set aerialUpSpecialUsage(v: number) { this.personality.writeUInt8(v, 0x34) }
  // 0x19d
  get aerialDownSpecialUsage(): number { return this.personality.readUInt8(0x35) }
  set aerialDownSpecialUsage(v: number) { this.personality.writeUInt8(v, 0x35) }

  // 0x1A3
  get costume(): number { return this.dataChunk.readUInt8(0xC3) }
  set costume(v: number) { this.dataChunk.writeUInt8(v, 0xC3) }


  save(): any {
    writeFileSync(this.path, this.binary);
  }
}

// abilities from 0x00 through 0xFF
export enum ABILITY {
  none1,
  moveSpeedUp,
  hyperSmashAttacks1,
  sword1,
  jumpUp,
  additionalMidairJump,
  lifesteal,
  shield1,
  easierDodging,
  easierPerfectShield,
  superArmor,
  slowSuperArmor,
  tradeOffAttackUp,
  tradeOffDefenseUp,
  tradeOffSpeedUp,
  tradeOffAbillityUp,
  criticalHealthAttackUp,
  criticalHealthDefenseUp,
  criticalHealthStatsUp,
  criticalImmunity,
  autoheal,
  poisonImmunity,
  poisonDamageReduced,
  poisonHeals,
  lavaFloorImmunity,
  stickyFloorImmunity,
  beamSwordEquipped,
  lipsStickEquipped,
  starRodEquipped,
  oreClubEquipped,
  homeRunBatEquipped,
  rayGunEquipped,
  superScopeEquipped,
  gustBellowsEquipped,
  drillEquipped,
  greenShellEquipped,
  pokeBallEquipped,
  blank1,
  backShieldEquipped,
  bunnyHoodEquipped,
  madeOfMetal,
  mouthfulOfCurry,
  franklinBadgeEquipped,
  hammerEquipped,
  fairyBottleEquipped,
  fireFlowerEquipped,
  freezieEquipped,
  ramblinEvilMushroomEquipped,
  killingEdgeEquipped,
  blank2,
  physicalAttackUp,
  weaponAttackUp,
  fistAttackUp,
  footAttackUp,
  auraAttackUp,
  magicAttackUp,
  psiAttackUp,
  sword2,
  fireAndExplosionAttackUp,
  sword3,
  electricAttackUp,
  energyShotAttackUp,
  waterAndIceAttackUp,
  magicResistUp,
  psiResistUp,
  shield2,
  fireExplosionResistUp,
  shield3,
  shield4,
  electricResistUp,
  energyShotResistUp,
  shield5,
  waterFreezingResistUp,
  auraResistUp,
  zapFloorImmunity,
  slumberImmunity,
  iceFloorImmunity,
  fallingImmunity,
  buryImmunity,
  brakingAbilityUp,
  shoe1,
  landingLagDown,
  lightweight,
  shieldDamageUp,
  airAttackUp1,
  airDefenseUp,
  neutralSpecialUp,
  sideSpecialUp,
  upSpecialUp,
  downSpecialUp,
  strongThrow,
  unflinchingChargedSmashes,
  tossAndMeteor,
  sword4,
  criticalHitUp,
  swimmer,
  shieldDurabilityUp,
  improvedEscape,
  shield6,
  shield_2,
  x1,
  batteringItemsUp,
  shootingItemsUp,
  thrownItemsUp,
  KOsHealDamage,
  invincibilityAfterEating,
  statsUpAfterEating,
  x2,
  firstStrikeAdvantage,
  x3,
  runningStart,
  x4,
  fastFinalSmashMeter,
  instadrop,
  healingShield,
  shield,
  x5,
  floatyJumps,
  shoe2,
  irreversibleControls,
  recoveryItemsUp,
  transformationDurationUp,
  undamagedAttackUp,
  undamagedSpeedUp,
  undamagedAttackAndSpeedUp,
  x6,
  medkit,
  edgeGrabUp,
  impactRun,
  x7,
  lavaFloorResist,
  itemGravitation,
  blank,
  chanceOfDoubleFinalSmash,
  doubleFinalSmash,
  hammer1_2,
  hammer2_2,
  metalAndGiant,
  giant,
  dashAttackUp,
  armorKnight,
  shield7,
  energyShotAttackResistanceUp,
  hammerDurationUp,
  boomerangEquipped,
  itemAttackUp,
  hammer,
  sword,
  shield8_2,
  shield9_2,
  x8,
  perfectShieldReflect,
  weaponAttackAndMoveSpeedUp,
  shootingAttackUp,
  chargeSpeedAndPowerUp,
  x9,
  screenFlipImmunity,
  fogImmunity,
  gravityChangeImmunity,
  staminaUp,
  strongWindResist,
  strongWindImmunity,
  criticalHealthHealing,
  specialMovePowerUp1,
  x10,
  bobOmbEquipped,
  hotheadEquipped,
  superLeafEquipped,
  superLaunchStarEquipped,
  beastballEquipped,
  deathsScytheEquipped,
  mrSaturnEquipped,
  uniraEquipped,
  rocketBeltEquipped,
  blackHoleEquipped,
  x11,
  statsUpUpAfterEating,
  hammer3_2,
  criticalHealthStatsUpUp,
  criticalHitUpUp,
  greatAutoheal,
  steelDiverEquipped,
  bananaGunEquipped,
  rageBlasterEquipped,
  staffEquipped,
  fireBarEquipped,
  screwAttackEquipped,
  bomberEquipped,
  cuccoEquipped,
  neutralAttackUp1,
  neutralAttackUpUp,
  tiltAttackUp1,
  tiltAttackUpUp,
  airAttackUpUp,
  mightyThrow,
  specialMovePowerUpUp,
  superEasyDodging,
  shoe3,
  landingLagDownDown,
  becomeHeavy,
  meteorSmashesUp,
  poisonedSmash,
  noPenaltyForContinuousDodging,
  airborneEndurance,
  sprintingEndurance,
  perfectShieldRecovery,
  masterfulFallBreak,
  healingItemAttraction,
  attackUpWhenHealthy,
  defenseUpWhenHealthy,
  endlessSmashHolding,
  healWithSmashAttacks,
  activitiesUp,
  giantKiller,
  metalKiller,
  assistKiller,
  jamFinalSmashCharge,
  weaponResistUp,
  hyperSmashAttacks2,
  neutralAttackUp2,
  tiltAttackUp2,
  specialMovePowerUp2,
  airAttackUp2,
  none2,
  none3,
  none4,
  none5,
  itemAutograb,
  none6,
  none7,
  none8,
  none9,
  none10,
  none11,
  none12,
  none13,
  none14,
  none15,
  none16,
  none17,
  none18,
  none19,
  none20,
  none21,
  none22,
  none23,
  none24,
  none25,
  none26,
  none27,
  none28,
  none29,
  none30,
  none31,
  none32,
  none33,
}