import assert from 'node:assert/strict';
import { emphasisParts, plainText } from '../src/lib/emphasis.ts';
assert.deepEqual(emphasisParts('내 역할: **팀장** / 개발'), [{text:'내 역할: ',strong:false},{text:'팀장',strong:true},{text:' / 개발',strong:false}]);
assert.equal(plainText('**시간순 평가**\n팀 실험 **R² 0.81**'), '시간순 평가\n팀 실험 R² 0.81');
assert.equal(plainText('**<img onerror=alert(1)>**'), '<img onerror=alert(1)>');
assert.throws(()=>emphasisParts('열린 **강조'));
assert.throws(()=>emphasisParts('빈 **** 강조'));
console.log('Editorial emphasis preserves text and rejects malformed markers.');
