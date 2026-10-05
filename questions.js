// ✏️ EDIT ME! The questions, in order.
//
// Multiple choice questions need:
//   q        the question
//   options  2 to 6 choices
//   answer   which option is correct, counting from 0 (0 = first, 1 = second, ...)
//   win      (optional) reaction for a right answer
//   lose     (optional) reaction for a wrong answer
//   quips    (optional) a custom reaction for picking a specific option,
//            e.g. quips: { Pizza: "Pizza?? Who even are you" }
//   note     (optional) extra line shown after answering
//
// Special rounds:
//   type: "runaway"  a yes/no question where the "no" button runs away
//   type: "hangman"  guess the phrase letter by letter
const QUESTIONS = [
  {
    q: "What's my go-to coffee order?",
    options: ["Iced oat latte", "Black, no nonsense", "Matcha, obviously", "Doesn't drink coffee"],
    answer: 3,
    win: "Correct. I run purely on vibes and audacity ☕🚫",
    lose: "I don't even DRINK coffee. How do you not know this 💀",
    quips: {
      "Matcha, obviously": "Matcha?? Do I look like a wellness influencer to you? 🍵",
    },
  },
  {
    q: "If I could eat one meal for the rest of forever, what would it be?",
    options: ["Sushi", "Pasta", "Tacos", "Pizza", "Shawarma", "Adria"],
    answer: 0,
    win: "Sushi. Raw fish, raw talent 🍣",
    lose: "Wrong. I'd sell you for a salmon roll and we both know it 🍣",
    quips: {
      Adria: "We know you think you're a snack, but no 🙄 It's sushi.",
      Shawarma: "Shawarma is a 2am decision, not a personality 🌯",
      Pizza: "Pizza?? Do I look that basic to you? Sushi, obviously.",
    },
  },
  {
    q: "What's my dream holiday destination?",
    options: ["Japan", "Italy", "Bali", "Iceland", "With you"],
    answer: 4,
    win: "Correct. Anywhere is a holiday with you 🥹✈️",
    lose: "Wrong. The answer was you. It's always you 🙄",
  },
  {
    type: "runaway",
    q: "Am I your favourite person?",
    yes: "Obviously ❤️",
    no: ["No", "Are you sure?", "Think again 🤨", "Wrong button", "Nice try", "This button is broken", "Just press yes 🙄"],
    win: "Correct answer. The only answer. Good choice 🥹",
  },
  {
    q: "Which emoji do I use the most?",
    options: ["😂", "💀", "🥹", "❤️"],
    answer: 0,
    win: "😂😂😂 Correct. As if you could forget",
    lose: "Wrong. 😂 is in literally every message I send you 😂",
  },
  {
    type: "hangman",
    q: "Something I always call you… that you should really admit about yourself 🙊",
    phrase: "I am a stinky bum",
    win: "YES U ARE A STINKY BUM 🦨💩",
    lose: "Denial won't save you. You ARE a stinky bum 💩",
  },
];

// ✏️ Your letter, revealed in an envelope at the very end after the candles.
// Each line in `paragraphs` and `ps` is its own paragraph. `name` is optional.
const LETTER = {
  greeting: "To Adria",
  paragraphs: [
    "Currently its 22:16 the 29 September 2026  I never write in my notes app but I can’t sleep for some reason…I am probably stressed about tomorrow (i have a meeting ) so I am gonna write this in advance 🙂 we played val today and it was nice to be around u again and yes I am horrible with dates especially when jan asked if i forgot his ( i really did ) but again I would never ever forget yours.",
    "Happy Birthdayy babyyy ❤️",
    "I know i lost the privilege to call u that but let it go for today.",
    "When we decided to break up earlier this year you said you wished I was around for your birthday. Secretly I also wished I did probably more than you did and maybe that’s why I really tried to keep in touch the whole time since it’s more of an important day to me than it is to you which is why I am writing all this.",
    "First of all , I wanna thank your beautiful mom (and dad) for being the main reason u are here ( especially ur mom 😏) they did an amazing job.",
    "Second of all , thank you for being you this whole time , I know our time was cut short but you gave me so much love and warmth that I never knew I was deeply craving and for that I will always be grateful to you.",
    "Regardless of our differences and the misunderstandings we went through, I want you to know that you are the most beautiful thought that my mind thinks of when I have nothing to worry or think about, for some reason it just puts me at ease and I hope u realize how great of human you are and give yourself grace when it’s needed.",
    "If someone were to ask me today why I still adore you so much I don’t think I could come up with an answer honestly , your personality, your looks how your mind works how fragile you can get your moments of jealousy your laugh … the list is endless and though I can’t offer you much I wanted to remind you today that you deserve much more love than I ever gave you . I am happy  you were my first and I still wish you would be my last maybe in some crazy turn of events or a parallel universe.",
    "I am sorry if I ever caused you harm intentionally or unintentionally tho you know u are the last person I’d ever want to make sad, and losing you is the biggest regret that i will keep with me my whole life. I am not saying it in the spur of the moment and definitely not to hear you say that I will eventually find someone or that I deserve better so please keep those thoughts to yourself.",
    "I really wish you a happy life filled with warmth, joy and people who care deeply about you and are interested in knowing all your sides  including what the little adria thinks , likes and wants.",
    "I could go on and on till the end of times but I think I said enough to convey my thoughts and feelings.",
  ],
  signoff: "Will always love you rakas ❤️ Happy Birthday",
  name: "",
  ps: [
    "PS: tears were shed writing this so u lil shit better read every word carefully",
    "PSS: hope u had a great day today if not i can show u a good time 😏😏",
    "PSSS: no am kidding 😂❤️",
    "Maybe not..",
  ],
};
