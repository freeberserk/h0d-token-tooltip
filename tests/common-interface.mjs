import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const src=await readFile(new URL("../scripts/h0d-token-tooltip.js",import.meta.url),"utf8");
const manifest=JSON.parse(await readFile(new URL("../module.json",import.meta.url),"utf8"));

assert.equal(manifest.version,"0.3.0");
assert.ok(src.includes('commonStatNumber(actor,"H0D_Defense")'),"DEF commune non lue");
assert.ok(src.includes('commonStatNumber(actor,"H0D_Perception")'),"PER commune non lue");
assert.ok(src.includes('commonStatNumber(actor,"H0D_Detection")'),"DET commune non lue");
assert.ok(src.includes('commonBarNumber(actor,"H0D_Health","value")'),"PV communs non lus");
assert.ok(src.includes("H0D_Defense_Totale_Calc"),"Fallback PJ DEF absent");
assert.ok(src.includes("H0D_Creature_DEF_Total_Calc"),"Fallback Créature DEF absent");
assert.ok(src.includes("H0D_Machine_DEF_Total_Calc"),"Fallback Machine DEF absent");
assert.ok(src.includes("H0D_Skill_Perception_Total"),"Fallback PJ PER absent");
assert.ok(src.includes("H0D_Creature_Perception"),"Fallback Créature PER absent");
assert.ok(src.includes("H0D_Machine_Perception_Effective_Calc"),"Fallback Machine PER absent");
assert.ok(src.includes("game.h0dTemplateManager?.commonStat"),"Pont vers l'API commune Template Manager absent");
assert.ok(src.includes("game.h0dTemplateManager?.commonHealth"),"Pont PV vers l'API commune Template Manager absent");

console.log("Token Tooltip common actor interface 0.3.0 OK");
