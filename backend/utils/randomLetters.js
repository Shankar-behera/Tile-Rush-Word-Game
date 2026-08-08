// Scrabble-style letter frequency so boards feel realistic instead of
// uniformly random (which produces too many Q/X/Z-heavy, unplayable boards).
const LETTER_WEIGHTS = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1,
  K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6,
  U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
};

const VOWELS = ['A', 'E', 'I', 'O', 'U'];

function weightedPool() {
  const pool = [];
  for (const [letter, weight] of Object.entries(LETTER_WEIGHTS)) {
    for (let i = 0; i < weight; i++) pool.push(letter);
  }
  return pool;
}

function generateLetters(count = 10, minVowels = 3, maxVowels = 5) {
  const pool = weightedPool();
  const consonantPool = pool.filter((l) => !VOWELS.includes(l));
  const letters = [];

  const vowelCount = () => letters.filter((l) => VOWELS.includes(l)).length;

  // Guarantee a playable minimum of vowels first.
  while (vowelCount() < minVowels) {
    letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
  }

  // Fill the rest, but stop drawing vowels once we hit the cap so boards
  // don't skew into unplayable vowel soup (a real risk given how common
  // E/A/I/O are in the weighted pool).
  while (letters.length < count) {
    const drawFromFullPool = vowelCount() < maxVowels;
    const source = drawFromFullPool ? pool : consonantPool;
    letters.push(source[Math.floor(Math.random() * source.length)]);
  }

  // Shuffle (Fisher-Yates) so vowels aren't all bunched at the front.
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  return letters.join('');
}

module.exports = generateLetters;
