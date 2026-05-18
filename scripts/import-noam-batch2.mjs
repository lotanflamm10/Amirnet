import { readFileSync, writeFileSync } from "fs";

const DB_PATH = "./src/data/seed/vocab.normalized.json";
const data = JSON.parse(readFileSync(DB_PATH, "utf-8"));

function normalize(word) {
  return word.replace(/^to\s+/i, "").toLowerCase().trim();
}

function guessPos(word) {
  const bare = normalize(word);
  if (word.toLowerCase().startsWith("to ")) return "verb";
  if (bare.endsWith("tion") || bare.endsWith("sion") || bare.endsWith("ment") ||
      bare.endsWith("ness") || bare.endsWith("ity") || bare.endsWith("ance") ||
      bare.endsWith("ence") || bare.endsWith("ism") || bare.endsWith("ist") ||
      bare.endsWith("ant") || bare.endsWith("or") || bare.endsWith("er") ||
      bare.endsWith("age")) return "noun";
  if (bare.endsWith("al") || bare.endsWith("ic") || bare.endsWith("ous") ||
      bare.endsWith("ful") || bare.endsWith("less") || bare.endsWith("ive") ||
      bare.endsWith("ary") || bare.endsWith("ent") || bare.endsWith("ble") ||
      bare.endsWith("ish")) return "adjective";
  if (bare.endsWith("ly")) return "adverb";
  return "noun";
}

function makeId(word) {
  return "noam_b2_" + normalize(word).replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

const NOW = new Date().toISOString();

function makeItem(word, hebrew, difficulty, category, exSentence, confusingWords, commonTrap) {
  const nw = normalize(word);
  return {
    id: makeId(word),
    word,
    normalizedWord: nw,
    hebrewTranslation: hebrew,
    englishDefinition: null,
    partOfSpeech: guessPos(word),
    difficulty,
    category,
    exampleSentence: exSentence || null,
    exampleSentenceHebrew: null,
    synonyms: [],
    antonyms: [],
    confusingWords: confusingWords || [],
    commonTrap: commonTrap || null,
    tags: ["noam_batch2"],
    source: "noam_machon_batch2",
    originalLine: word,
    needsReview: false,
    studyPriority: difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 7,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

// ─── 300 Important Words ──────────────────────────────────────────────────────
const IMPORTANT_WORDS = [
  // A
  { word: "ability", hebrew: "יכולת", diff: "easy", ex: "She has an amazing ability to see the good in everything." },
  { word: "able", hebrew: "יכול", diff: "easy", ex: "If you study hard enough, you will be able to get a good score in the test." },
  { word: "according to", hebrew: "לפי", diff: "easy", ex: "I know how to drive a car, according to my driving instructor." },
  { word: "to account for", hebrew: "להוות / להסביר / להיות אחראי ל", diff: "medium", ex: "Jews account for 75% of the Israeli population." },
  { word: "actually", hebrew: "למעשה", diff: "easy", ex: "I actually like her." },
  { word: "to adapt to", hebrew: "להתרגל", diff: "medium", ex: "Shir is starting to adapt to her new school." },
  { word: "adolescent", hebrew: "מתבגר", diff: "medium", ex: "If you are 17-year-old, you are a teenager, or an adolescent." },
  { word: "adult", hebrew: "מבוגר", diff: "easy", ex: "A child cannot cross the road without holding an adult's hand." },
  { word: "advantage", hebrew: "יתרון", diff: "medium", ex: "Speaking more than one language is an advantage." },
  { word: "advocate", hebrew: "חסיד, תומך של / סנגור, פרקליט, עורך דין", diff: "hard", ex: "If you don't want to go to prison, you are going to need an advocate." },
  { word: "to advocate", hebrew: "לתמוך ב, לדגול ב", diff: "hard", ex: "I do not advocate the use of violence." },
  { word: "to affect", hebrew: "להשפיע", diff: "medium", ex: "The death of his father affected him." },
  { word: "all", hebrew: "הכל", diff: "easy", ex: "All you need is love." },
  { word: "to allow", hebrew: "להרשות / לאפשר", diff: "easy", ex: "Dan's mother did not allow him to go out with his friends." },
  { word: "among", hebrew: "בין, בקרב", diff: "easy", ex: "Miley Cyrus is popular among young people." },
  { word: "ancient", hebrew: "עתיק", diff: "medium", ex: "Tel Aviv is a new city, about 100 years old, but Jerusalem is ancient." },
  { word: "annual", hebrew: "שנתי", diff: "medium", ex: "A magazine that comes out once a year is an annual magazine." },
  { word: "answer", hebrew: "תשובה", diff: "easy", ex: "I want to hear your answer to my question." },
  { word: "to answer", hebrew: "לענות", diff: "easy", ex: "The teacher's question was easy, so many students could answer it." },
  { word: "to appear", hebrew: "להופיע", diff: "easy", ex: "The actor Will Smith appears in many movies." },
  { word: "appearance", hebrew: "הופעה, מראה", diff: "medium", ex: "Everyone likes the appearance of that top model." },
  { word: "to argue", hebrew: "לטעון / להתווכח", diff: "medium", ex: "The drunk driver is going to argue that the accident was not her fault." },
  { word: "argument", hebrew: "טיעון / ויכוח", diff: "medium", ex: "I understand what Shir is saying because her arguments are so clear." },
  { word: "art", hebrew: "אמנות", diff: "easy", ex: "I don't understand modern art, and I think no one does." },
  { word: "artist", hebrew: "אמן", diff: "easy", ex: "Leonardo da Vinci was both an artist and a scientist." },
  { word: "author", hebrew: "כותב, סופר", diff: "easy", ex: "I love that author! I read all of her books." },
  { word: "average", hebrew: "ממוצע", diff: "easy", ex: "On average, every 3 minutes a baby is born in the world." },
  // B
  { word: "basis", hebrew: "בסיס", diff: "medium", ex: "Trust is the basis for a good relationship." },
  { word: "basic", hebrew: "בסיסי", diff: "easy", ex: "Everyone should have basic knowledge in history." },
  { word: "behavior", hebrew: "התנהגות", diff: "medium", ex: "The child's behavior is strange today. I hope she's not sick." },
  { word: "behind", hebrew: "מאחורי", diff: "easy", ex: "Dana is hiding behind the tree." },
  { word: "benefit", hebrew: "יתרון, תועלת, רווח", diff: "medium", ex: "Shir's high intelligence is a great benefit for her." },
  { word: "to benefit", hebrew: "להפיק תועלת מ, להרוויח", diff: "medium", ex: "I believe we can benefit from any experience." },
  { word: "bible", hebrew: "תנ\"ך", diff: "easy", ex: "The bible is the world's most popular book." },
  { word: "blood", hebrew: "דם", diff: "easy", ex: "The doctor told me to get a blood test once a year." },
  // C
  { word: "can", hebrew: "יכול", diff: "easy", ex: "Anything you can do, I can do better." },
  { word: "cancer", hebrew: "סרטן", diff: "easy", ex: "Cancer is a terrible disease." },
  { word: "case", hebrew: "מקרה / תיק", diff: "medium", ex: "In most cases, telling lies is not a good idea." },
  { word: "cause", hebrew: "גורם, סיבה", diff: "medium", ex: "A lighted cigarette was the cause of the fire." },
  { word: "to cause", hebrew: "לגרום", diff: "medium", ex: "I don't want to cause you any pain." },
  { word: "century", hebrew: "מאה (שנים)", diff: "easy", ex: "We live in the 21st century." },
  { word: "certain", hebrew: "מסוים / בטוח, וודאי", diff: "medium", ex: "She had certain personal problems with me." },
  { word: "challenge", hebrew: "אתגר", diff: "medium", ex: "Running a marathon is a great challenge." },
  { word: "to challenge", hebrew: "לאתגר", diff: "medium", ex: "Alon wants to run a marathon because he likes to challenge himself." },
  { word: "character", hebrew: "דמות / אופי / סימן, תו", diff: "medium", ex: "This story has two main characters: a father and his son." },
  { word: "characteristic", hebrew: "אופייני / מאפיין", diff: "hard", ex: "He responded to the good news with his characteristic smile." },
  { word: "to characterize", hebrew: "לאפיין", diff: "hard", ex: "Scientists are trying to characterize the newly found planet." },
  { word: "citizen", hebrew: "אזרח, תושב", diff: "medium", ex: "I'm proud to be an Israeli citizen." },
  { word: "claim", hebrew: "טענה", diff: "medium", ex: "Alon's claim was not strong enough to win the argument." },
  { word: "to claim", hebrew: "לטעון / לאסוף, לקחת", diff: "medium", ex: "The drunk driver is going to claim that the accident was not his fault." },
  { word: "close", hebrew: "קרוב", diff: "easy", ex: "The hotel is close to the beach." },
  { word: "to close", hebrew: "לסגור", diff: "easy", ex: "Don't forget to close the door!" },
  { word: "common", hebrew: "נפוץ, שכיח / משותף / מעמד פשוט", diff: "easy", ex: "English is a common language, unlike Hebrew, which is spoken by fewer people." },
  { word: "community", hebrew: "קהילה", diff: "medium", ex: "A group of people who live together form a community." },
  { word: "to compare", hebrew: "להשוות", diff: "medium", ex: "Almog likes to compare prices before he decides where to buy." },
  { word: "comparison", hebrew: "השוואה", diff: "medium", ex: "The comparison between these children is not fair because they come from different backgrounds." },
  { word: "to complete", hebrew: "להשלים", diff: "medium", ex: "I must complete my homework by tomorrow." },
  { word: "completely", hebrew: "לחלוטין", diff: "easy", ex: "I'm not completely sure I will be able to arrive to the party." },
  { word: "component", hebrew: "רכיב", diff: "medium", ex: "The screen, speaker and battery are all different components of a cellphone." },
  { word: "to conduct", hebrew: "לבצע (ניסוי)", diff: "medium", ex: "The teacher showed the students how to conduct the experiment." },
  { word: "to consider", hebrew: "להחשיב", diff: "medium", ex: "I consider myself a good student." },
  { word: "to consist of", hebrew: "להיות מורכב מ", diff: "medium", ex: "Japan consists of five main islands." },
  { word: "to contain", hebrew: "להכיל", diff: "medium", ex: "Children should not have access to products that contain dangerous chemicals." },
  { word: "continent", hebrew: "יבשת", diff: "medium", ex: "Asia is the largest continent. Australia is the smallest." },
  { word: "correct", hebrew: "נכון", diff: "easy", ex: "Yes, your answer is correct." },
  { word: "to correct", hebrew: "לתקן", diff: "easy", ex: "My teacher always corrects my spelling mistakes." },
  { word: "country", hebrew: "ארץ, מדינה / אזור הכפר", diff: "easy", ex: "Russia is the largest country in the world." },
  { word: "court", hebrew: "בית משפט / חצר מלוכה / מגרש ספורט", diff: "medium", ex: "A judge works for the court." },
  { word: "to create", hebrew: "ליצור", diff: "medium", ex: "According to the Bible, God created the world in six days." },
  { word: "creature", hebrew: "יצור", diff: "medium", ex: "Most living creatures need water to survive." },
  { word: "critic", hebrew: "מבקר", diff: "medium", ex: "The food critic wrote a very good review about the new restaurant." },
  { word: "critical", hebrew: "ביקורתי", diff: "medium", ex: "Alon thinks that Shir is too critical and that nothing is good enough for her." },
  { word: "to criticize", hebrew: "לבקר", diff: "medium", ex: "Shir criticizes Alon a lot. Nothing he says or does is good enough for her." },
  { word: "culture", hebrew: "תרבות", diff: "medium", ex: "Shir loves traveling to foreign countries and learning about different cultures." },
  { word: "cultural", hebrew: "תרבותי", diff: "medium", ex: "There are cultural differences between Israel and England." },
  { word: "current", hebrew: "נוכחי, עכשווי / זרם", diff: "medium", ex: "Their current teacher is much better than the teacher they had last year." },
  // D
  { word: "damage", hebrew: "נזק", diff: "medium", ex: "The accident resulted in serious damage to the car, but thankfully no one was hurt." },
  { word: "to damage", hebrew: "להזיק, לגרום נזק", diff: "medium", ex: "If you drink too much alcohol, you could damage your health." },
  { word: "danger", hebrew: "סכנה", diff: "easy", ex: "Parents should protect their children from danger." },
  { word: "dangerous", hebrew: "מסוכן", diff: "easy", ex: "Children should not have access to products that contain dangerous chemicals." },
  { word: "data", hebrew: "נתונים", diff: "easy", ex: "In science, evidence is data that is considered reliable." },
  { word: "decade", hebrew: "עשור", diff: "medium", ex: "The 1990s were the last decade of the 20th century." },
  { word: "to decide", hebrew: "להחליט, לקבוע", diff: "easy", ex: "Shir likes to compare prices before she decides where to buy." },
  { word: "decrease", hebrew: "ירידה מספרית", diff: "medium", ex: "The company closed because of a massive decrease in the number of clients." },
  { word: "to decrease", hebrew: "לרדת, לפחות", diff: "medium", ex: "The number of students in the boring course decreased from 30 to 20." },
  { word: "to define", hebrew: "להגדיר", diff: "medium", ex: "Some feelings are hard to define." },
  { word: "definition", hebrew: "הגדרה", diff: "medium", ex: "In a Hebrew dictionary, you can find the definition of a word." },
  { word: "to demonstrate", hebrew: "להפגין / להדגים", diff: "medium", ex: "Democratic countries allow their citizens to demonstrate against almost any issue." },
  { word: "to depict", hebrew: "לתאר", diff: "hard", ex: "Charles Dickens's novels depict life in England in the 19th century." },
  { word: "to describe", hebrew: "לתאר", diff: "medium", ex: "Please try to describe in detail what happened yesterday morning." },
  { word: "description", hebrew: "תיאור", diff: "medium", ex: "Before you send your resume, please read the job description." },
  { word: "to design", hebrew: "לעצב", diff: "medium", ex: "The job of an architect is to design buildings." },
  { word: "to determine", hebrew: "לקבוע, להחליט", diff: "medium", ex: "I find it very hard to determine which dancer is better." },
  { word: "to develop", hebrew: "לפתח / להתפתח", diff: "medium", ex: "The engineer tried to develop a new machine." },
  { word: "development", hebrew: "התפתחות", diff: "medium", ex: "The project is still in stages of development." },
  { word: "device", hebrew: "מתקן, מכשיר", diff: "medium", ex: "The cellphone is the most popular electronic device of this decade." },
  { word: "difference", hebrew: "שוני, הבדל", diff: "easy", ex: "The twins may look alike, but there are major differences in their character." },
  { word: "different", hebrew: "שונה", diff: "easy", ex: "Liat always knew she is different from the other girls." },
  { word: "disadvantage", hebrew: "חיסרון", diff: "medium", ex: "It's good to know your opponent's disadvantage." },
  { word: "to discover", hebrew: "לגלות", diff: "medium", ex: "His goal was to discover a cure for cancer." },
  { word: "discovery", hebrew: "תגלית", diff: "medium", ex: "The discovery of gold in California attracted many immigrants." },
  { word: "to discuss", hebrew: "לדון", diff: "medium", ex: "We need to discuss this decision." },
  { word: "disease", hebrew: "מחלה", diff: "easy", ex: "Cancer is a terrible disease." },
  { word: "to display", hebrew: "להראות / להציג / להפגין", diff: "medium", ex: "He was trained not to display fear." },
  { word: "during", hebrew: "במהלך", diff: "easy", ex: "It's good to exercise at least twice during the week." },
  // E
  { word: "economy", hebrew: "כלכלה", diff: "medium", ex: "The economy of Eilat is based mostly on tourism." },
  { word: "education", hebrew: "חינוך", diff: "medium", ex: "Good education makes better citizens." },
  { word: "effect", hebrew: "השפעה", diff: "medium", ex: "This movie had a great effect on Shir." },
  { word: "effective", hebrew: "יעיל", diff: "medium", ex: "A smart person finds effective solutions to problems." },
  { word: "elderly", hebrew: "זקן, קשיש", diff: "medium", ex: "My grandmother is elderly." },
  { word: "to elect", hebrew: "להצביע / לבחור", diff: "medium", ex: "It is important to elect, each vote counts." },
  { word: "elections", hebrew: "בחירות", diff: "medium", ex: "Bibi Netanyahu won several elections." },
  { word: "emergency", hebrew: "מקרה חירום", diff: "medium", ex: "You should know how to act in case of a medical emergency." },
  { word: "to employ", hebrew: "להעסיק", diff: "medium", ex: "This company employs 100 workers." },
  { word: "employee", hebrew: "עובד", diff: "medium", ex: "A person who works for a company is called an employee." },
  { word: "employer", hebrew: "מעסיק, מעביד", diff: "medium", ex: "An employer is the person or company you work for." },
  { word: "entirely", hebrew: "לחלוטין", diff: "medium", ex: "Shani cleaned the house entirely by herself." },
  { word: "environment", hebrew: "סביבה", diff: "medium", ex: "It's important to protect our environment." },
  { word: "even", hebrew: "אפילו / שווה / זוגי", diff: "easy", ex: "I love my cat, even if it is dumb." },
  { word: "eventually", hebrew: "לבסוף", diff: "medium", ex: "You will learn the rules of the game eventually." },
  { word: "evidence", hebrew: "הוכחות, ראיות", diff: "medium", ex: "In science, evidence is data that is considered reliable." },
  { word: "to explain", hebrew: "להסביר", diff: "easy", ex: "If you don't understand something, the teacher will explain it to you." },
  { word: "explanation", hebrew: "הסבר", diff: "medium", ex: "The teacher's explanation was clear, and the student now understands." },
  { word: "to express", hebrew: "להביע, לבטא", diff: "medium", ex: "Shir bought Alon a present to express her love for him." },
  { word: "expression", hebrew: "הבעה / ביטוי", diff: "medium", ex: "You can tell how people feel by the expression on their faces." },
  // F
  { word: "to face", hebrew: "לעמוד בפני", diff: "medium", ex: "The two people are to face charges of theft." },
  { word: "famous", hebrew: "מפורסם", diff: "easy", ex: "The most famous drink in the world is Coca-Cola." },
  { word: "findings", hebrew: "ממצאים", diff: "medium", ex: "The findings of the experiment are listed below." },
  { word: "first", hebrew: "ראשון", diff: "easy", ex: "The first letter in the alphabet is A." },
  { word: "following", hebrew: "בעקבות הבא(ים)", diff: "medium", ex: "Following the deaths, there has been more sea and air patrol." },
  { word: "future", hebrew: "עתיד", diff: "easy", ex: "Yotam's favorite movie is Back to the Future." },
  // G
  { word: "government", hebrew: "ממשלה", diff: "medium", ex: "A government is a group of people who control a country." },
  { word: "great", hebrew: "דגול / גדול, עצום / טוב מאד, מצוין, נפלא", diff: "easy", ex: "Alexander III of Macedon is commonly known as Alexander the Great." },
  // H
  { word: "harm", hebrew: "נזק", diff: "easy", ex: "She'll do anything to protect her children from harm." },
  { word: "to harm", hebrew: "להזיק", diff: "easy", ex: "I am sorry, I didn't mean to harm you." },
  { word: "harmful", hebrew: "מזיק", diff: "medium", ex: "Not getting enough sleep can be harmful." },
  { word: "harmless", hebrew: "לא מזיק", diff: "medium", ex: "The dog may look scary, but it is harmless." },
  { word: "huge", hebrew: "ענק", diff: "easy", ex: "Taking the test without studying for it was a huge mistake." },
  { word: "human", hebrew: "בן אדם / אנושי", diff: "easy", ex: "Another word for people is humans." },
  // I
  { word: "idea", hebrew: "רעיון", diff: "easy", ex: "We did not know what to do, but then Shir had a great idea." },
  { word: "to illustrate", hebrew: "לאייר / להדגים", diff: "medium", ex: "It is very common to illustrate children's books." },
  { word: "in order to", hebrew: "על מנת, כדי", diff: "easy", ex: "In order to succeed, you need to work hard." },
  { word: "increase", hebrew: "עלייה מספרית", diff: "medium", ex: "There has been an increase in sales." },
  { word: "to increase", hebrew: "לעלות מספרית", diff: "medium", ex: "He wants to increase the number." },
  { word: "industry", hebrew: "תעשייה", diff: "medium", ex: "The film industry in Bollywood is the richest in the world." },
  { word: "infant", hebrew: "תינוק", diff: "medium", ex: "Another word for a baby is an infant." },
  { word: "to infer", hebrew: "להסיק", diff: "hard", ex: "We should be able to infer from this fact." },
  { word: "influence", hebrew: "השפעה", diff: "medium", ex: "The Red Cross says it wants to have a bigger influence." },
  { word: "to influence", hebrew: "להשפיע", diff: "medium", ex: "He used his power to influence them." },
  { word: "information", hebrew: "מידע", diff: "easy", ex: "An encyclopedia contains a lot of information." },
  { word: "ingredient", hebrew: "מרכיב", diff: "medium", ex: "This cake has only three ingredients: eggs, flour and chocolate." },
  { word: "to inhabit", hebrew: "ליישב, לאכלס", diff: "hard", ex: "Red wolves used to inhabit Texas." },
  { word: "inhabitant", hebrew: "תושב", diff: "medium", ex: "There are about 400,000 inhabitants in Tel Aviv." },
  { word: "instead (of)", hebrew: "במקום", diff: "easy", ex: "The students went to the park instead of going to class." },
  { word: "interview", hebrew: "ראיון", diff: "medium", ex: "His job interview will be tomorrow morning." },
  { word: "to interview", hebrew: "לראיין", diff: "medium", ex: "Human resources will need to interview several candidates for the position." },
  { word: "to invent", hebrew: "להמציא", diff: "medium", ex: "Alexander Graham Bell invented the telephone in 1876." },
  { word: "invention", hebrew: "המצאה", diff: "medium", ex: "The invention of the computer changed our lives." },
  { word: "inventor", hebrew: "ממציא", diff: "medium", ex: "Alexander Graham Bell is the inventor of the telephone." },
  // K
  { word: "kind", hebrew: "סוג / טוב לב, אדיב", diff: "easy", ex: "There are many kinds of vegetables in the market." },
  { word: "to know", hebrew: "לדעת / להכיר", diff: "easy", ex: "He knows all the words in this song." },
  { word: "knowledge", hebrew: "ידע", diff: "medium", ex: "Everyone should have basic knowledge in history." },
  // L
  { word: "lab", hebrew: "מעבדה", diff: "easy", ex: "Scientists spend most of their time in the lab." },
  { word: "laboratory", hebrew: "מעבדה (פורמלי)", diff: "medium", ex: "The university has a new physics laboratory." },
  { word: "lack", hebrew: "חוסר, היעדר", diff: "medium", ex: "There is a lack of good teachers in the public school system." },
  { word: "language", hebrew: "שפה", diff: "easy", ex: "Hebrew and English are examples of languages." },
  { word: "last", hebrew: "אחרון/ה / שעבר", diff: "easy", ex: "The last letter in the alphabet is Z." },
  { word: "letter", hebrew: "אות / מכתב", diff: "easy", ex: "The first letter in the alphabet is A." },
  { word: "limit", hebrew: "גבול", diff: "medium", ex: "This night club has an age limit of 18." },
  { word: "to limit", hebrew: "להגביל", diff: "medium", ex: "I am trying to limit my sugar intake." },
  { word: "limitation", hebrew: "מגבלה", diff: "medium", ex: "I know my limitations." },
  { word: "to list", hebrew: "למנות", diff: "medium", ex: "The students were asked to list three important inventions." },
  { word: "local", hebrew: "מקומי", diff: "easy", ex: "In Italy, we ate in a nice local restaurant." },
  { word: "located", hebrew: "ממוקם", diff: "easy", ex: "The hotel is located near the beach." },
  { word: "location", hebrew: "מיקום", diff: "easy", ex: "We found an apartment in a great location!" },
  // M
  { word: "main", hebrew: "עיקרי, ראשי", diff: "easy", ex: "The main idea of a paragraph appears in the first sentence." },
  { word: "mainly", hebrew: "בעיקר", diff: "easy", ex: "He failed the test mainly because he was very tired." },
  { word: "major", hebrew: "עיקרי, ראשי, מרכזי / רב סרן / חוג (לימודים) ראשי", diff: "medium", ex: "Finding love is a major issue in the lives of many people." },
  { word: "majority", hebrew: "רוב", diff: "medium", ex: "The majority of the student body feels that tuition is too high." },
  { word: "market", hebrew: "שוק", diff: "easy", ex: "Danit goes every day to the market to buy fruit and vegetables." },
  { word: "to market", hebrew: "לשווק", diff: "medium", ex: "My job is to market the company's new product." },
  { word: "may", hebrew: "עלול / רשאי", diff: "medium", ex: "I may come to the party tonight, but I'm not 100% sure." },
  { word: "to mean", hebrew: "להתכוון / שפירושו הוא", diff: "easy", ex: "I don't know what you mean." },
  { word: "meaning", hebrew: "משמעות", diff: "easy", ex: "What is the meaning of the word 'illness'?" },
  { word: "means", hebrew: "אמצעי (תחבורה למשל)", diff: "medium", ex: "A bus, a taxi and a train are means of transportation." },
  { word: "medicine", hebrew: "רפואה / תרופה", diff: "medium", ex: "If you want to become a doctor, you have to study medicine." },
  { word: "minority", hebrew: "מיעוט", diff: "medium", ex: "Jews and African Americans are minorities in the USA." },
  { word: "most", hebrew: "רוב", diff: "easy", ex: "Most of the time Shir is happy, but sometimes she is sad." },
  { word: "mostly", hebrew: "לרוב, בעיקר", diff: "easy", ex: "She likes to go to the gym mostly to swim in the pool." },
  { word: "must", hebrew: "חייב", diff: "easy", ex: "You must pass a driving test before you can start driving legally." },
  // N
  { word: "narrow", hebrew: "צר", diff: "easy", ex: "The door is at the end of the narrow hallway." },
  { word: "nature", hebrew: "טבע", diff: "easy", ex: "Nature is the physical world and everything in it that is not made by people." },
  { word: "novel", hebrew: "רומאן (ספר) / חדש", diff: "medium", ex: "The first Harry Potter novel was published in 1997." },
  // O
  { word: "only", hebrew: "רק, בלבד / (ה)יחיד, בודד", diff: "easy", ex: "He went to the store to buy only milk." },
  { word: "opinion", hebrew: "דעה", diff: "easy", ex: "In my opinion, vanilla ice cream is the best!" },
  { word: "organization", hebrew: "ארגון", diff: "medium", ex: "The university started an organization to help foreign students learn English." },
  { word: "to organize", hebrew: "לארגן", diff: "medium", ex: "The teacher needs to organize a class trip." },
  { word: "origin", hebrew: "מקור", diff: "medium", ex: "The origin of the holiday Halloween is unclear to many scholars." },
  { word: "to originate in/from", hebrew: "שמקורו ב", diff: "hard", ex: "The English language originated from the Anglo-Frisian dialects." },
  { word: "over", hebrew: "למעלה מ / במשך", diff: "easy", ex: "Over 80% of the students thought the course was interesting." },
  // P
  { word: "paragraph", hebrew: "פסקה", diff: "medium", ex: "The text consists of several paragraphs." },
  { word: "parent", hebrew: "הורה", diff: "easy", ex: "A parent is anyone who has children." },
  { word: "particularly", hebrew: "במיוחד", diff: "medium", ex: "I love fruits, particularly apples." },
  { word: "patient", hebrew: "חולה (פציינט) / סבלני", diff: "medium", ex: "The doctor took care of the patient." },
  { word: "people", hebrew: "אנשים / עם", diff: "easy", ex: "People love to go on holiday." },
  { word: "peoples", hebrew: "עמים", diff: "medium", ex: "The United Nation is an organization that unites all the peoples for a better world." },
  { word: "percent", hebrew: "אחוז", diff: "easy", ex: "There is a ninety percent chance of rain tomorrow." },
  { word: "percentage", hebrew: "אחוז", diff: "medium", ex: "The percentage of girls in our class is sixty, so they are the majority." },
  { word: "phrase", hebrew: "ביטוי, צירוף מילים", diff: "medium", ex: "Shir used her pen to underline important words and phrases in the text." },
  { word: "physician", hebrew: "רופא", diff: "medium", ex: "I woke up feeling sick, so I went to see my physician." },
  { word: "plan", hebrew: "תוכנית", diff: "easy", ex: "We have a plan for world domination." },
  { word: "to plan", hebrew: "לתכנן", diff: "easy", ex: "The most wonderful things happen when you don't plan anything." },
  { word: "plant", hebrew: "צמח", diff: "easy", ex: "You can find many exotic plants in the Australian botanical gardens." },
  { word: "play", hebrew: "מחזה", diff: "easy", ex: "The audience in the theater really enjoyed the play." },
  { word: "poor", hebrew: "עני / מסכן / ירוד, גרוע", diff: "easy", ex: "Poor families don't have enough money to feed their children." },
  { word: "population", hebrew: "אוכלוסייה", diff: "medium", ex: "The estimated world population is 7 billion people." },
  { word: "practice", hebrew: "מנהג", diff: "medium", ex: "Leaving for a honeymoon after the wedding is a common practice." },
  { word: "to practice", hebrew: "להתאמן / לעסוק ב", diff: "medium", ex: "Runners need to practice for at least 4 months before competing in marathon." },
  { word: "present", hebrew: "מתנה / הווה / נוכח / נוכחי", diff: "medium", ex: "I like birthdays because I always get many presents." },
  { word: "to present", hebrew: "להציג", diff: "medium", ex: "This week's assignment is to present a paper on American history." },
  { word: "previous", hebrew: "קודם", diff: "medium", ex: "I don't like the new teacher. I prefer the previous one." },
  { word: "previously", hebrew: "קודם לכן", diff: "medium", ex: "Previously on Lost." },
  { word: "process", hebrew: "תהליך", diff: "medium", ex: "The novel is not done yet, it is still a work in process." },
  { word: "to process", hebrew: "לעבד", diff: "medium", ex: "When someone hears bad news, they usually need some time to process it." },
  { word: "to produce", hebrew: "להפיק / לייצר", diff: "medium", ex: "It costs a lot of money to produce a movie." },
  { word: "profit", hebrew: "רווח", diff: "medium", ex: "I sold my house with great profit." },
  { word: "profitable", hebrew: "רווחי", diff: "medium", ex: "My profitable business made me rich." },
  { word: "prove", hebrew: "להוכיח", diff: "medium", ex: "I don't have to prove anything to you." },
  { word: "to provide", hebrew: "לספק", diff: "medium", ex: "You'll provide the food, I'll provide the entertainment." },
  { word: "public", hebrew: "ציבורי", diff: "easy", ex: "The case was closed due to lack of public interest." },
  { word: "purpose", hebrew: "מטרה", diff: "medium", ex: "The purpose of this sentence is to help you remember the meaning of the word 'purpose'." },
  // Q
  { word: "to question", hebrew: "להטיל ספק / לתשאל", diff: "medium", ex: "To question the existence of Santa Claus is to doubt whether he is actually real." },
  // R
  { word: "recent", hebrew: "שארע לאחרונה", diff: "medium", ex: "The recent changes in Facebook have been publicly introduced yesterday." },
  { word: "recently", hebrew: "לאחרונה, בזמן האחרון", diff: "medium", ex: "The director has recently finished filming the movie." },
  { word: "to refer to", hebrew: "להתייחס ל", diff: "medium", ex: "It is recommended to refer to a Dictionary when encountering an unfamiliar word." },
  { word: "region", hebrew: "אזור", diff: "medium", ex: "The south region of the country is called 'the Negev'." },
  { word: "relative", hebrew: "קרוב משפחה / יחסי", diff: "medium", ex: "A relative from out of town is coming to visit me." },
  { word: "relatively", hebrew: "באופן יחסי", diff: "medium", ex: "This year's party was relatively successful compared to last year's party." },
  { word: "religion", hebrew: "דת", diff: "easy", ex: "The Dominant religion in Israel is Judaism." },
  { word: "religious", hebrew: "דתי", diff: "easy", ex: "A religious person goes to church every Sunday and reads the Bible every day." },
  { word: "to replace", hebrew: "להחליף", diff: "medium", ex: "Most people don't know how to replace bike tires." },
  { word: "research", hebrew: "מחקר", diff: "medium", ex: "The research focused on the relation between age and health." },
  { word: "researcher", hebrew: "חוקר", diff: "medium", ex: "The researcher published the results of his experiment." },
  { word: "result", hebrew: "תוצאה", diff: "easy", ex: "The result of the soccer game was 0:0." },
  { word: "role", hebrew: "תפקיד", diff: "easy", ex: "Who played the role of Hamlet tonight?" },
  { word: "rule", hebrew: "חוק / שלטון", diff: "easy", ex: "Every game has rules." },
  { word: "to rule", hebrew: "לשלוט", diff: "medium", ex: "Britain ruled India for many years." },
  // S
  { word: "to save", hebrew: "להציל / לשמור / לחסוך", diff: "easy", ex: "She saved the boy's life." },
  { word: "scholar", hebrew: "חוקר, מלומד", diff: "hard", ex: "This scholar knows a lot about history." },
  { word: "science", hebrew: "מדע", diff: "easy", ex: "Biology, physics and chemistry are all sciences." },
  { word: "scientific", hebrew: "מדעי", diff: "medium", ex: "The monthly scientific journal describes the Israeli development in medicine." },
  { word: "scientist", hebrew: "מדען", diff: "medium", ex: "A scientist conducts research." },
  { word: "second", hebrew: "שני / שנייה", diff: "easy", ex: "The second letter in the alphabet is B." },
  { word: "serial", hebrew: "סדרתי", diff: "medium", ex: "A serial killer is a murderer who killed more than 3 people." },
  { word: "series", hebrew: "סדרה, סדרות", diff: "medium", ex: "My favorite TV series is The Simpsons." },
  { word: "several", hebrew: "אחדים", diff: "easy", ex: "Another word for some is several." },
  { word: "should", hebrew: "צריך", diff: "easy", ex: "You should listen to your brother." },
  { word: "silence", hebrew: "דממה", diff: "easy", ex: "I love the silence of the night." },
  { word: "silent", hebrew: "שקט", diff: "easy", ex: "Another word for quiet is silent." },
  { word: "similar", hebrew: "דומה", diff: "easy", ex: "The test was very similar to the practice tests I did at home." },
  { word: "similarity", hebrew: "דמיון (בין דבר אחד למשנהו)", diff: "medium", ex: "There are many similarities between children and their parents." },
  { word: "size", hebrew: "גודל, מידה", diff: "easy", ex: "My shoe size is 39." },
  { word: "society", hebrew: "חברה", diff: "medium", ex: "In an organized society, there are basic rules." },
  { word: "sole", hebrew: "יחיד, יחידי, בודד / סוליה", diff: "medium", ex: "Shir was the sole survivor of the accident. All the others died." },
  { word: "solely", hebrew: "רק, אך ורק, בלבד", diff: "medium", ex: "My child eats solely bread for breakfast. He won't eat anything else." },
  { word: "solution", hebrew: "פתרון / תמיסה", diff: "medium", ex: "A smart person finds effective solutions to problems." },
  { word: "source", hebrew: "מקור", diff: "medium", ex: "Spinach is the source of Popeye's power." },
  { word: "space", hebrew: "חלל / רווח, מרחב", diff: "easy", ex: "An astronaut is someone who goes into space." },
  { word: "species", hebrew: "זן, מין", diff: "hard", ex: "A rare species of dolphin was seen near the coast of Israel." },
  { word: "spring", hebrew: "מעיין / אביב", diff: "easy", ex: "Spring comes after winter." },
  { word: "state", hebrew: "מדינה / מצב", diff: "medium", ex: "I live in the state of Israel." },
  { word: "to state", hebrew: "לציין", diff: "medium", ex: "The last reports stated that the product's sales continue to grow." },
  { word: "study", hebrew: "מחקר", diff: "medium", ex: "Another word for an experiment is a study." },
  { word: "to study", hebrew: "ללמוד / לחקור", diff: "easy", ex: "The student began to study for the test two days ago." },
  { word: "subject", hebrew: "נושא / משתתף במחקר / נתין", diff: "medium", ex: "The subject of the article is very interesting." },
  { word: "success", hebrew: "הצלחה", diff: "easy", ex: "There is no success without hard work." },
  { word: "successful", hebrew: "מוצלח", diff: "medium", ex: "The successful actor came to perform in our local theater." },
  { word: "to suggest", hebrew: "להציע / לרמז על", diff: "medium", ex: "I would like to suggest having an additional meeting next week." },
  { word: "survey", hebrew: "סקר", diff: "medium", ex: "According to a recent survey, over 86% of Israelis use the Internet every day." },
  // T
  { word: "the most", hebrew: "הכי", diff: "easy", ex: "Titanic is one of the most popular movies ever made." },
  { word: "throughout", hebrew: "לאורך (זמן) / בכל רחבי (מקום)", diff: "medium", ex: "I was tired throughout the day." },
  { word: "title", hebrew: "כותרת / תואר", diff: "medium", ex: "The title of the first Harry Potter novel is Harry Potter and the Philosopher's Stone." },
  { word: "tongue", hebrew: "לשון", diff: "medium", ex: "After eating the peach, Shir's tongue became white." },
  { word: "tourism", hebrew: "תיירות", diff: "medium", ex: "The economy of the city of Eilat is highly dependent on tourism." },
  { word: "tourist", hebrew: "תייר", diff: "easy", ex: "Many French tourists visit Israel each year." },
  { word: "tradition", hebrew: "מסורת", diff: "medium", ex: "In Judaism, it is a tradition to eat matzah on Passover." },
  { word: "to translate", hebrew: "לתרגם", diff: "medium", ex: "I am trying to translate the article from Italian to English." },
  { word: "transportation", hebrew: "תחבורה", diff: "medium", ex: "Every day I arrive to work using public transportation." },
  { word: "to travel", hebrew: "לטייל", diff: "easy", ex: "When I was 22 years old, I traveled in India alone." },
  { word: "type", hebrew: "סוג, טיפוס", diff: "easy", ex: "A bulldog is a type of dog." },
  { word: "typical", hebrew: "טיפוסי", diff: "medium", ex: "On a typical day, Shir wakes up at 7:30 AM." },
  // U
  { word: "to use", hebrew: "להשתמש", diff: "easy", ex: "I use GPS to navigate the roads." },
  { word: "use", hebrew: "שימוש", diff: "easy", ex: "A swiss army knife has many uses." },
  // V
  { word: "vacation", hebrew: "חופשה", diff: "easy", ex: "I am going on a one week vacation." },
  { word: "various", hebrew: "רבים ושונים", diff: "medium", ex: "There are various kinds of vegetables in the market." },
  { word: "to vote", hebrew: "להצביע (בבחירות)", diff: "medium", ex: "Only citizens can vote in the elections." },
  // W
  { word: "to warn", hebrew: "להזהיר", diff: "easy", ex: "It is important to warn visitors if you have a big dog." },
  { word: "wealth", hebrew: "עושר", diff: "medium", ex: "He enjoyed a life of luxury and wealth." },
  { word: "whether", hebrew: "האם", diff: "medium", ex: "I cannot decide whether I want to start studying in the university or not." },
];

// ─── Confusing Word Groups ─────────────────────────────────────────────────────
// Each group: words that are commonly confused with each other.
// Format: { words: [{word, hebrew}], trap: reason for confusion }
const CONFUSING_GROUPS = [
  {
    trap: "All start with 'tho-' but have completely different meanings",
    words: [
      { word: "though", hebrew: "למרות" },
      { word: "thought", hebrew: "מחשבה" },
      { word: "through", hebrew: "דרך" },
      { word: "thorough", hebrew: "יסודי" },
    ]
  },
  {
    trap: "Similar sound: accept (לקבל), except (חוץ מ), expect (לצפות), aspect (היבט) - different prefixes change meaning entirely",
    words: [
      { word: "accept", hebrew: "לקבל" },
      { word: "except", hebrew: "חוץ מ, למעט" },
      { word: "expect", hebrew: "לצפות" },
      { word: "aspect", hebrew: "צד, היבט" },
    ]
  },
  {
    trap: "lose (להפסיד) vs loose (משוחרר) - one 'o' changes meaning completely",
    words: [
      { word: "lose", hebrew: "להפסיד" },
      { word: "loose", hebrew: "משוחרר" },
    ]
  },
  {
    trap: "ambiguous (דו-משמעי) vs ambitious (שאפתן) - similar pronunciation, opposite qualities",
    words: [
      { word: "ambiguous", hebrew: "דו-משמעי" },
      { word: "ambitious", hebrew: "שאפתן" },
    ]
  },
  {
    trap: "despite (למרות), despise (לבוז), disguise (תחפושת) - similar 'dis-' prefix but unrelated meanings",
    words: [
      { word: "despite", hebrew: "למרות, חרף" },
      { word: "despise", hebrew: "לבוז, לתעב" },
      { word: "disguise", hebrew: "תחפושת" },
    ]
  },
  {
    trap: "patients (פציינטים - plural noun) vs patience (סבלנות - abstract noun) - identical pronunciation",
    words: [
      { word: "patients", hebrew: "פציינטים" },
      { word: "patience", hebrew: "סבלנות" },
    ]
  },
  {
    trap: "comprehend (להבין) vs comprehensive (מקיף) - one is a verb, the other an adjective",
    words: [
      { word: "comprehend", hebrew: "לתפוס, להבין" },
      { word: "comprehensive", hebrew: "מקיף" },
    ]
  },
  {
    trap: "practice (אימון/מנהג) vs participate (להשתתף) - both start with 'par/pra'",
    words: [
      { word: "participate", hebrew: "להשתתף" },
    ]
  },
  {
    trap: "conclude/include/exclude - same root '-clude' with different prefixes changing direction",
    words: [
      { word: "conclude", hebrew: "לסכם, להסיק" },
      { word: "include", hebrew: "לכלול" },
      { word: "exclude", hebrew: "להוציא מן הכלל" },
    ]
  },
  {
    trap: "claim (טענה/לדרוש), acclaim (שבחים), reclaim (לדרוש בחזרה) - prefixes change meaning",
    words: [
      { word: "acclaim", hebrew: "שבחים, ביקורות טובות" },
      { word: "reclaim", hebrew: "לדרוש מחדש דבר מה" },
    ]
  },
  {
    trap: "imitate (לחקות), intimate (אינטימי), intimidate (להפחיד) - very similar spelling",
    words: [
      { word: "imitate", hebrew: "לחקות" },
      { word: "intimate", hebrew: "אינטימי" },
      { word: "intimidate", hebrew: "להפחיד, לאיים" },
    ]
  },
  {
    trap: "sensitive (רגיש - emotional) vs sensible (הגיוני - rational) - completely opposite personality traits",
    words: [
      { word: "sensitive", hebrew: "רגיש" },
      { word: "sensible", hebrew: "סביר, הגיוני" },
    ]
  },
  {
    trap: "recipe (מתכון) vs receipt (קבלה) - silent 'p' in receipt; often confused in writing",
    words: [
      { word: "recipe", hebrew: "מתכון" },
      { word: "receipt", hebrew: "קבלה" },
    ]
  },
  {
    trap: "access (גישה) vs excess (עודף) - one letter difference changes meaning entirely",
    words: [
      { word: "access", hebrew: "גישה" },
      { word: "excess", hebrew: "עודף (כמותי)" },
    ]
  },
  {
    trap: "allowed (מותר) vs aloud (בקול רם) - identical pronunciation (homophones)",
    words: [
      { word: "aloud", hebrew: "בקול רם" },
    ]
  },
  {
    trap: "allude (לרמוז) vs elude (להתחמק) - similar sound but different meanings",
    words: [
      { word: "allude", hebrew: "לרמוז" },
      { word: "elude", hebrew: "להתחמק" },
    ]
  },
  {
    trap: "bear (דב/לשאת) vs bare (חשוף) - homophones with very different meanings",
    words: [
      { word: "bear", hebrew: "דב / לשאת" },
      { word: "bare", hebrew: "חשוף" },
    ]
  },
  {
    trap: "born (נולד), borne/bourn (נישא על גבי), bore (לחפור) - same sound, different spellings and meanings",
    words: [
      { word: "borne", hebrew: "נישא (על גבי)" },
      { word: "bore", hebrew: "לחפור" },
    ]
  },
  {
    trap: "borrow (לשאול חפץ) vs burrow (להתחפר) - one letter difference",
    words: [
      { word: "borrow", hebrew: "לשאול (חפץ)" },
      { word: "burrow", hebrew: "להתחפר" },
    ]
  },
  {
    trap: "collaborate (לשתף פעולה) vs corroborate (לאמת) - similar structure but very different meanings",
    words: [
      { word: "collaborate", hebrew: "לשתף פעולה" },
      { word: "corroborate", hebrew: "לאמת" },
    ]
  },
  {
    trap: "course (מסלול/קורס), coarse (גס), curse (קללה) - similar pronunciation",
    words: [
      { word: "coarse", hebrew: "גס" },
      { word: "curse", hebrew: "קללה" },
    ]
  },
  {
    trap: "die (למות) vs dye (לצבוע/צבע) - homophones with completely different meanings",
    words: [
      { word: "dye", hebrew: "צבע / לצבוע" },
    ]
  },
  {
    trap: "emerge (להגיח מתוך) vs immerge (להשרות בתוך) - opposite directions",
    words: [
      { word: "emerge", hebrew: "להגיח" },
      { word: "immerge", hebrew: "להשרות" },
    ]
  },
  {
    trap: "find (למצוא) vs finding (ממצא) - noun/verb confusion common in academic texts",
    words: [
      { word: "finding", hebrew: "ממצא" },
    ]
  },
  {
    trap: "quality (איכות), equality (שיויון), equity (הוגנות/ערך מניות) - same root '-quality'",
    words: [
      { word: "equality", hebrew: "שיויון" },
      { word: "equity", hebrew: "הוגנות / ערך מניות של חברה" },
    ]
  },
  {
    trap: "fore (לפני), for (עבור), four (ארבע) - identical or near-identical pronunciation",
    words: [
      { word: "fore", hebrew: "לפני, קודם ל" },
    ]
  },
  {
    trap: "reign (שלטון) vs rain (גשם) - homophones (both pronounced 'rein')",
    words: [
      { word: "reign", hebrew: "שלטון" },
      { word: "rain", hebrew: "גשם" },
    ]
  },
  {
    trap: "herd (עדר) vs heard (שמע) - homophones; different parts of speech",
    words: [
      { word: "herd", hebrew: "עדר" },
      { word: "heard", hebrew: "שמע (עבר של hear)" },
    ]
  },
  {
    trap: "presence (נוכחות) vs presents (מתנות OR מציג) - one letter difference; also presents has two pronunciations",
    words: [
      { word: "presence", hebrew: "נוכחות" },
    ]
  },
  {
    trap: "quiet (שקט), quite (למדי), quit (לפרוש) - similar spelling, different meanings",
    words: [
      { word: "quiet", hebrew: "שקט" },
      { word: "quite", hebrew: "למדי, די" },
      { word: "quit", hebrew: "לפרוש, להפסיק" },
    ]
  },
  {
    trap: "seem (נראה) vs seam (תפר בחולצה) - homophones",
    words: [
      { word: "seem", hebrew: "נראה" },
      { word: "seam", hebrew: "תפר (בחולצה)" },
    ]
  },
  {
    trap: "vain (יהיר/ריק) vs vein (וריד) - homophones",
    words: [
      { word: "vain", hebrew: "יהיר, ריק מתוכן" },
      { word: "vein", hebrew: "וריד" },
    ]
  },
  {
    trap: "weather (מזג אויר) vs whether (האם) - homophones that appear in similar contexts",
    words: [
      { word: "weather", hebrew: "מזג אויר" },
    ]
  },
  {
    trap: "sense (חוש) vs essence (מהות/תמצית) - similar endings",
    words: [
      { word: "sense", hebrew: "חוש" },
      { word: "essence", hebrew: "מהות, תמצית" },
    ]
  },
  {
    trap: "since (מאז/בגלל ש) vs science (מדע) - similar spelling, different pronunciation",
    words: [
      { word: "since", hebrew: "מאז, בגלל ש" },
    ]
  },
  {
    trap: "proceed (להמשיך/להתקדם) vs precede (להקדים) - one letter changes direction in time",
    words: [
      { word: "proceed", hebrew: "להתקדם, להמשיך" },
      { word: "precede", hebrew: "להקדים" },
    ]
  },
  {
    trap: "precedence (תקדים) vs presidents (נשיאים) - similar sound, different meaning",
    words: [
      { word: "precedence", hebrew: "תקדים" },
      { word: "presidents", hebrew: "נשיאים" },
    ]
  },
  {
    trap: "price (מחיר) vs prize (פרס) - one letter difference; both relate to value",
    words: [
      { word: "price", hebrew: "מחיר" },
      { word: "prize", hebrew: "פרס" },
    ]
  },
  {
    trap: "than (מאשר - comparison) vs then (אז - time) vs them (הם - pronoun)",
    words: [
      { word: "than", hebrew: "מאשר" },
      { word: "then", hebrew: "אז" },
    ]
  },
  {
    trap: "passed (חלף - past tense of pass), past (זמן עבר/מעבר), pass (לעבור/להעביר)",
    words: [
      { word: "passed", hebrew: "חלף (עבר של pass)" },
      { word: "past", hebrew: "זמן עבר / מעבר ל" },
      { word: "pass", hebrew: "לעבור, להעביר" },
    ]
  },
  {
    trap: "prove (להוכיח), improve (לשפר), approve (לאשר) - same root with prefixes",
    words: [
      { word: "improve", hebrew: "לשפר" },
      { word: "approve", hebrew: "לאשר" },
    ]
  },
  {
    trap: "later (אחר כך), latter (האחרון מתוך רשימה), letter (מכתב) - similar spelling",
    words: [
      { word: "later", hebrew: "אחר כך, מאוחר יותר" },
      { word: "latter", hebrew: "האחרון (מתוך רשימה או קבוצה)" },
    ]
  },
  {
    trap: "plain (מישור/פשוט) vs plane (מטוס) - homophones",
    words: [
      { word: "plain", hebrew: "מישור, פשוט" },
      { word: "plane", hebrew: "מטוס" },
    ]
  },
  {
    trap: "raise (העלאה בשכר), race (גזע/מרוץ), rise (עלייה), rice (אורז) - similar spelling",
    words: [
      { word: "raise", hebrew: "העלאה (בשכר)" },
      { word: "race", hebrew: "גזע / מרוץ" },
      { word: "rise", hebrew: "עלייה" },
      { word: "rice", hebrew: "אורז" },
    ]
  },
  {
    trap: "liter (ליטר) vs litter (ללכלך/המלטה) - one letter changes meaning entirely",
    words: [
      { word: "liter", hebrew: "ליטר" },
      { word: "litter", hebrew: "ללכלך / המלטה" },
    ]
  },
  {
    trap: "good (טוב) vs goods (סחורה) - adding 's' changes part of speech entirely",
    words: [
      { word: "goods", hebrew: "סחורה" },
    ]
  },
  {
    trap: "conscious (מודע/ער) vs conscience (מצפון) vs cautious (זהיר) - similar sound",
    words: [
      { word: "conscious", hebrew: "מודע, ער" },
      { word: "conscience", hebrew: "מצפון" },
      { word: "cautious", hebrew: "זהיר" },
    ]
  },
  {
    trap: "effective (יעיל) vs affective (רגשי) - one letter difference; common in academic/psychological texts",
    words: [
      { word: "affective", hebrew: "רגשי" },
    ]
  },
  {
    trap: "cell (תא) vs sell (למכור) - homophones",
    words: [
      { word: "cell", hebrew: "תא" },
      { word: "sell", hebrew: "למכור" },
    ]
  },
  {
    trap: "cent (סנט), sent (שלח), scent (ניחוח) - homophones/near-homophones",
    words: [
      { word: "cent", hebrew: "סנט" },
      { word: "sent", hebrew: "שלח (עבר של send)" },
      { word: "scent", hebrew: "ניחוח, ריח של" },
    ]
  },
  {
    trap: "flower (פרח) vs flour (קמח) - near-homophones that look similar",
    words: [
      { word: "flour", hebrew: "קמח" },
    ]
  },
  {
    trap: "poor (עני), pour (למזוג), pore (נקבובית) - similar sound",
    words: [
      { word: "pour", hebrew: "למזוג" },
      { word: "pore", hebrew: "נקבובית" },
    ]
  },
  {
    trap: "tale (סיפור) vs tail (זנב) - homophones",
    words: [
      { word: "tale", hebrew: "סיפור" },
      { word: "tail", hebrew: "זנב" },
    ]
  },
  {
    trap: "right (ימין/צודק) vs write (לכתוב) - homophones",
    words: [
      { word: "right", hebrew: "ימין / צודק" },
      { word: "write", hebrew: "לכתוב" },
    ]
  },
  {
    trap: "steal (לגנוב), steel (פלדה), still (עדיין) - similar spelling with different meanings",
    words: [
      { word: "steal", hebrew: "לגנוב" },
      { word: "steel", hebrew: "פלדה" },
      { word: "still", hebrew: "עדיין" },
    ]
  },
  {
    trap: "purpose (מטרה/תכלית) vs propose (להציע) - similar beginning",
    words: [
      { word: "propose", hebrew: "להציע" },
    ]
  },
  {
    trap: "acquire (לרכוש), require (לדרוש), inquire (לברר) - same '-quire' root with different prefixes",
    words: [
      { word: "acquire", hebrew: "לרכוש" },
      { word: "require", hebrew: "לדרוש" },
      { word: "inquire", hebrew: "לברר" },
    ]
  },
  {
    trap: "desperate (נואש) vs separate (נפרד) - similar structure but different stress patterns",
    words: [
      { word: "desperate", hebrew: "נואש" },
      { word: "separate", hebrew: "נפרד" },
    ]
  },
  {
    trap: "join (להצטרף) vs joint (משותף/מפרק) - noun vs verb confusion",
    words: [
      { word: "joint", hebrew: "משותף / מפרק (איבר בגוף)" },
    ]
  },
  {
    trap: "accent (מבטא), ascent (עלייה), assent (הסכמה) - very similar pronunciation",
    words: [
      { word: "accent", hebrew: "מבטא" },
      { word: "ascent", hebrew: "עלייה" },
      { word: "assent", hebrew: "הסכמה" },
    ]
  },
  {
    trap: "throne (כס מלוכה), thrown (נזרק), thorn (קוץ) - similar spelling",
    words: [
      { word: "throne", hebrew: "כס מלוכה" },
      { word: "thrown", hebrew: "נזרק (עבר של throw)" },
      { word: "thorn", hebrew: "קוץ" },
    ]
  },
  {
    trap: "fair (הוגן/יפה) vs fare (דמי נסיעה/סוג אוכל) - homophones",
    words: [
      { word: "fair", hebrew: "הוגן / יפה, ענוג" },
      { word: "fare", hebrew: "דמי נסיעה / סוג אוכל / להתקדם" },
    ]
  },
  {
    trap: "natural (טבעי) vs neutral (נייטרלי) - similar appearance, different meaning",
    words: [
      { word: "natural", hebrew: "טבעי" },
      { word: "neutral", hebrew: "נייטרלי" },
    ]
  },
  {
    trap: "deceased (נפטר) vs decreased (הופחת בכמותו) - similar appearance, opposite context",
    words: [
      { word: "deceased", hebrew: "מנוח, נפטר" },
      { word: "decreased", hebrew: "הופחת בכמותו" },
    ]
  },
  {
    trap: "perceive (לתפוס בהבנה), receive (לקבל), conceive (להגות רעיון) - same '-ceive' root",
    words: [
      { word: "perceive", hebrew: "לתפוס בהבנה" },
      { word: "conceive", hebrew: "להגות (רעיון) / להיכנס להיריון" },
    ]
  },
  {
    trap: "advertise (לפרסם), adversity (קושי גדול), adversary (יריב) - similar 'adver-' prefix",
    words: [
      { word: "advertise", hebrew: "לפרסם" },
      { word: "adversity", hebrew: "קושי גדול" },
      { word: "adversary", hebrew: "יריב" },
    ]
  },
  {
    trap: "aisle (מעבר בין שורות) vs isle (אי) - nearly identical pronunciation",
    words: [
      { word: "aisle", hebrew: "מעבר בין שורות (כמו בסופרמרקט)" },
      { word: "isle", hebrew: "אי" },
    ]
  },
  {
    trap: "alter (לשנות) vs altar (מזבח בכנסייה) - one letter difference",
    words: [
      { word: "alter", hebrew: "לשנות" },
      { word: "altar", hebrew: "מזבח / במה בכנסייה" },
    ]
  },
  {
    trap: "descent (ירידה/מוצא אתני), decent (הגון/מספיק), consent (לתת הסכמה) - similar sound",
    words: [
      { word: "descent", hebrew: "תנועה לכוון מטה / מוצא אתני" },
      { word: "decent", hebrew: "הגון, מספיק" },
      { word: "consent", hebrew: "לתת הסכמה" },
    ]
  },
  {
    trap: "cereal (דגני בוקר) vs serial (סדרתי) - homophones",
    words: [
      { word: "cereal", hebrew: "דגני בוקר" },
    ]
  },
  {
    trap: "compliment (מחמאה) vs complimentary (הניתן בחינם) - related but different usage",
    words: [
      { word: "compliment", hebrew: "מחמאה" },
      { word: "complimentary", hebrew: "דבר הניתן בחינם" },
    ]
  },
  {
    trap: "dual (זוגי/כפול) vs duel (דו-קרב) - one letter difference",
    words: [
      { word: "dual", hebrew: "זוגי, כפול" },
      { word: "duel", hebrew: "דו-קרב" },
    ]
  },
  {
    trap: "destruction (הרס) vs distraction (הסחת דעת) - similar structure",
    words: [
      { word: "destruction", hebrew: "הרס" },
      { word: "distraction", hebrew: "הסחת דעת" },
    ]
  },
  {
    trap: "deceive (להונות) vs decisive (החלטי) - similar beginning 'dec-'",
    words: [
      { word: "deceive", hebrew: "להונות" },
      { word: "decisive", hebrew: "החלטי" },
    ]
  },
  {
    trap: "parent (הורה), apparent (ניכר), transparent (שקוף) - same '-parent' root with prefixes",
    words: [
      { word: "apparent", hebrew: "ניכר, ברור לעין" },
      { word: "apparently", hebrew: "כנראה ש" },
      { word: "transparent", hebrew: "שקוף" },
    ]
  },
  {
    trap: "consider (להחשיב), considerate (מתחשב), considerable (משמעותי), considerations (אילוצים)",
    words: [
      { word: "considerate", hebrew: "מתחשב" },
      { word: "considerable", hebrew: "ניכר, משמעותי" },
      { word: "considerations", hebrew: "אילוצים, שיקולים" },
    ]
  },
  {
    trap: "conversion (המרה) vs conversation (שיחה) - similar spelling",
    words: [
      { word: "conversion", hebrew: "המרה" },
      { word: "conversation", hebrew: "שיחה" },
    ]
  },
  {
    trap: "tribute (מחווה), attribute (תכונה/ליחס), contribute (לתרום), distribute (להפיץ) - same '-tribute' root",
    words: [
      { word: "tribute", hebrew: "מחווה" },
      { word: "attribute", hebrew: "תכונה / ליחס ל" },
      { word: "contribute", hebrew: "לתרום (זמן והשקעה)" },
      { word: "distribute", hebrew: "להפיץ" },
    ]
  },
  {
    trap: "decline (ירידה/דחייה) vs incline (לנטות) - opposite prefix meaning",
    words: [
      { word: "decline", hebrew: "ירידה / דחייה" },
      { word: "incline", hebrew: "לנטות" },
    ]
  },
  {
    trap: "gradual (הדרגתי) vs graduate (לסיים לימודים) - same root, different part of speech",
    words: [
      { word: "gradual", hebrew: "הדרגתי" },
      { word: "graduate", hebrew: "לסיים לימודים / בוגר" },
    ]
  },
  {
    trap: "generate (לייצר/לחולל), general (כללי/גנרל), generic (כללי), genre (ז'אנר) - same Latin root 'gen-'",
    words: [
      { word: "generate", hebrew: "לייצר, לחולל" },
      { word: "generic", hebrew: "כללי, גנרי" },
      { word: "genre", hebrew: "ז'אנר" },
    ]
  },
  {
    trap: "occur (להתרחש), concur (לאשש), conquer (לכבוש) - similar pronunciation",
    words: [
      { word: "occur", hebrew: "להתרחש" },
      { word: "concur", hebrew: "לאשש" },
      { word: "conquer", hebrew: "לכבוש" },
    ]
  },
  {
    trap: "illuminate (להאיר) vs eliminate (לחסל/להסיר) - similar ending but opposite effect",
    words: [
      { word: "illuminate", hebrew: "להאיר" },
      { word: "eliminate", hebrew: "להסיר, לחסל" },
    ]
  },
  {
    trap: "paddle (לחתור) vs puddle (שלולית) - one vowel difference",
    words: [
      { word: "paddle", hebrew: "לחתור" },
      { word: "puddle", hebrew: "שלולית" },
    ]
  },
  {
    trap: "mansion (אחוזה) vs mention (להזכיר) - similar sound",
    words: [
      { word: "mansion", hebrew: "אחוזה (בית מפואר)" },
      { word: "mention", hebrew: "להזכיר" },
    ]
  },
  {
    trap: "station (תחנה) vs stationary (נייח) - same root but different meaning",
    words: [
      { word: "station", hebrew: "תחנה" },
      { word: "stationary", hebrew: "נייח" },
    ]
  },
];

// ─── Processing ───────────────────────────────────────────────────────────────

// Build dedup set from existing DB
const existingLookup = new Set();
for (const item of data) {
  existingLookup.add(item.normalizedWord.toLowerCase());
  existingLookup.add(normalize(item.word));
}

let added = 0;
let skipped = 0;
const newItems = [];

function tryAdd(item) {
  const nw = item.normalizedWord.toLowerCase();
  const bare = normalize(item.word);
  if (existingLookup.has(nw) || existingLookup.has(bare)) {
    skipped++;
    return;
  }
  existingLookup.add(nw);
  existingLookup.add(bare);
  newItems.push(item);
  added++;
}

// Process important words
for (const entry of IMPORTANT_WORDS) {
  tryAdd(makeItem(entry.word, entry.hebrew, entry.diff, "exam useful words", entry.ex, [], null));
}

// Process confusing word groups
for (const group of CONFUSING_GROUPS) {
  const groupWordsList = group.words.map(w => w.word);
  for (const entry of group.words) {
    const others = groupWordsList.filter(w => w !== entry.word);
    tryAdd(makeItem(entry.word, entry.hebrew, "hard", "trap words", null, others, group.trap));
  }
}

// Merge and write
const merged = [...data, ...newItems];
writeFileSync(DB_PATH, JSON.stringify(merged, null, 2), "utf-8");

console.log(`Batch 2 import complete.`);
console.log(`  Added:   ${added}`);
console.log(`  Skipped: ${skipped} (already in DB)`);
console.log(`  Total DB size: ${merged.length}`);

// Verify no duplicate normalizedWords
const allNW = merged.map(x => x.normalizedWord);
const uniqueNW = new Set(allNW).size;
console.log(`  Unique normalizedWords: ${uniqueNW}`);
if (uniqueNW < merged.length) {
  console.warn(`  WARNING: ${merged.length - uniqueNW} duplicate normalizedWords detected!`);
} else {
  console.log(`  No duplicates detected.`);
}
