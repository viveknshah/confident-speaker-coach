export const TOPICS = [
  "Describe a time you were wrong and glad of it.",
  "What is the best advice you ignored?",
  "Is it better to be early or on time?",
  "Tell us about a door that changed your life.",
  "What would you do with one extra hour every day?",
  "Describe a small kindness you still remember.",
  "Which is harder: starting or finishing?",
  "Convince us that boredom is useful.",
  "What does home sound like?",
  "Tell us about a promise you almost broke.",
  "If you could un-learn one thing, what would it be?",
  "Why do we trust strangers on the road but not on the internet?",
  "Describe the worst meal that became a good story.",
  "Alone or lonely: what is the difference?",
  "What would your younger self say about you today?",
  "Is luck something you can practise?",
  "Defend a rule you secretly like.",
  "Tell us about a goodbye that did not go to plan.",
  "What is overrated, and what is underrated?",
  "A lesson from a place you never meant to visit."
];
export const pickTopic = (exclude = "") => {
  const pool = TOPICS.filter(t => t !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
};
