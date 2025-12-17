// Comprehensive names dictionary for NER enhancement
// Organized by origin/region for maintainability

// Arabic first names (common in Saudi Arabia and Gulf region)
export const ARABIC_FIRST_NAMES = new Set([
  // Male names
  'abdullah', 'abdulrahman', 'abdulaziz', 'abdulmajid', 'abdulkarim', 'abdulmalik',
  'ahmed', 'ahmad', 'ali', 'amin', 'amir', 'ammar', 'anas', 'ashraf',
  'badr', 'bandar', 'basim', 'bassam', 'bilal',
  'dalal', 'dawood', 'dhafer',
  'fahad', 'faisal', 'faris', 'fawaz', 'fouad',
  'ghassan', 'ghazi',
  'hamad', 'hamza', 'hani', 'hassan', 'hatem', 'hazem', 'hussein', 'hussain',
  'ibrahim', 'imad', 'issa', 'ismail',
  'jamal', 'jassim', 'jawad',
  'kamal', 'kareem', 'karim', 'khalid', 'khaled', 'khalil',
  'majed', 'majid', 'malek', 'malik', 'mansour', 'marwan', 'mazin', 'mishaal', 'mishal',
  'mohammed', 'mohammad', 'mohamed', 'muhammed', 'muhannad', 'mubarak', 'musab', 'mustafa',
  'nabil', 'nader', 'naif', 'nasser', 'nawaf', 'nizar', 'nouf',
  'omar', 'osama', 'othman',
  'rashid', 'rayan', 'riad', 'riyadh',
  'saad', 'saber', 'saeed', 'said', 'saleh', 'salem', 'salim', 'salman', 'sami', 'samir',
  'sultan', 'saud', 'sulaiman', 'suleiman',
  'talal', 'tarek', 'tariq', 'tawfiq', 'turki',
  'waleed', 'walid', 'waseem',
  'yasser', 'yasir', 'yousef', 'youssef', 'yusuf',
  'zaid', 'zayed', 'ziyad',
  // Female names
  'abeer', 'afnan', 'aisha', 'alia', 'amani', 'amira', 'arwa', 'asma', 'aseel',
  'dana', 'dalia', 'deema', 'dina',
  'fatima', 'fatimah', 'farah', 'fatin',
  'ghada', 'ghadeer',
  'hala', 'hanan', 'haya', 'hind', 'huda',
  'joud', 'jumana',
  'khadija', 'khadijah', 'khawla',
  'lama', 'layan', 'layla', 'leena', 'lina', 'lubna', 'lujain',
  'maha', 'mai', 'maram', 'mariam', 'maryam', 'manal', 'mona', 'munira',
  'nada', 'nadine', 'nahla', 'najla', 'noura', 'noor', 'nur',
  'rania', 'reem', 'reema', 'rahaf', 'rawda', 'ruqaya',
  'sahar', 'salma', 'samia', 'samira', 'sara', 'sarah', 'shahad', 'shatha',
  'wafa', 'widad',
  'yara', 'yasmin', 'yasmine',
  'zainab', 'zaina'
])

// Arabic family names (common in Saudi Arabia and Gulf)
export const ARABIC_FAMILY_NAMES = new Set([
  'aldosari', 'aldossari', 'almubarak', 'almubrad', 'alshammari', 'alharbi', 'alqahtani',
  'alsaud', 'alsubaie', 'alotaibi', 'alanazi', 'alghamdi', 'alzahrani', 'almutairi',
  'alrashid', 'alrashidi', 'alfaisal', 'alturki', 'alsaleh', 'alhammad', 'alkhaldi',
  'aljaber', 'alnahdi', 'albishi', 'almalki', 'almansour', 'alfarhan', 'alkhalifa',
  'bin', 'ibn', // Name connectors
  'al', 'el' // Common prefixes (handled separately)
])

// Western/English first names
export const WESTERN_FIRST_NAMES = new Set([
  // Male names
  'aaron', 'adam', 'adrian', 'alan', 'albert', 'alex', 'alexander', 'alfred', 'andrew', 'anthony', 'arthur', 'austin',
  'benjamin', 'bernard', 'bill', 'billy', 'bob', 'bobby', 'brad', 'bradley', 'brandon', 'brian', 'bruce',
  'carl', 'carlos', 'chad', 'charles', 'charlie', 'chris', 'christian', 'christopher', 'clarence', 'claude', 'colin', 'craig',
  'dale', 'dan', 'daniel', 'danny', 'darren', 'dave', 'david', 'dean', 'dennis', 'derek', 'derrick', 'don', 'donald', 'douglas', 'drew', 'dustin', 'dylan',
  'earl', 'eddie', 'edgar', 'edward', 'edwin', 'eli', 'elijah', 'elliot', 'eric', 'ernest', 'ethan', 'eugene', 'evan',
  'felix', 'fernando', 'francis', 'frank', 'franklin', 'fred', 'frederick',
  'gabriel', 'gary', 'gavin', 'gene', 'george', 'gerald', 'gilbert', 'glen', 'glenn', 'gordon', 'graham', 'grant', 'greg', 'gregory', 'guy',
  'harold', 'harrison', 'harry', 'harvey', 'hector', 'henry', 'herbert', 'howard', 'hugh', 'hugo', 'hunter',
  'ian', 'isaac', 'ivan',
  'jack', 'jackson', 'jacob', 'jake', 'james', 'jamie', 'jared', 'jason', 'jay', 'jeff', 'jeffrey', 'jeremy', 'jerome', 'jerry', 'jesse', 'jim', 'jimmy', 'joe', 'joel', 'john', 'johnny', 'jonathan', 'jordan', 'jose', 'joseph', 'josh', 'joshua', 'juan', 'julian', 'justin',
  'karl', 'keith', 'kelly', 'ken', 'kenneth', 'kevin', 'kirk', 'kurt', 'kyle',
  'lance', 'larry', 'lawrence', 'lee', 'leonard', 'leo', 'leon', 'lewis', 'liam', 'lloyd', 'logan', 'louis', 'lucas', 'luis', 'luke',
  'malcolm', 'manuel', 'marc', 'marcus', 'mario', 'mark', 'marshall', 'martin', 'marvin', 'mason', 'matt', 'matthew', 'maurice', 'max', 'maxwell', 'michael', 'miguel', 'mike', 'miles', 'mitchell', 'morgan',
  'nathan', 'neil', 'nelson', 'nicholas', 'nick', 'noah', 'noel', 'norman',
  'oliver', 'oscar', 'owen',
  'patrick', 'paul', 'perry', 'peter', 'phil', 'philip', 'phillip', 'pierre',
  'quincy', 'quinn',
  'rafael', 'ralph', 'ramon', 'randall', 'randy', 'ray', 'raymond', 'reginald', 'rene', 'rex', 'ricardo', 'richard', 'rick', 'ricky', 'rob', 'robert', 'roberto', 'robin', 'rodney', 'roger', 'roland', 'roman', 'ron', 'ronald', 'ross', 'roy', 'ruben', 'russell', 'ryan',
  'sam', 'samuel', 'scott', 'sean', 'sebastian', 'sergio', 'seth', 'shane', 'shawn', 'simon', 'spencer', 'stanley', 'stephen', 'steve', 'steven', 'stuart', 'sydney',
  'ted', 'terrence', 'terry', 'theodore', 'thomas', 'tim', 'timothy', 'todd', 'tom', 'tommy', 'tony', 'travis', 'trevor', 'troy', 'tyler',
  'victor', 'vincent', 'virgil',
  'wade', 'wallace', 'walter', 'warren', 'wayne', 'wesley', 'william', 'willie', 'wilson',
  'xavier',
  'zachary', 'zane',
  // Female names
  'abigail', 'ada', 'agnes', 'alice', 'alicia', 'allison', 'amanda', 'amber', 'amy', 'andrea', 'angela', 'ann', 'anna', 'anne', 'annie', 'april', 'ashley', 'audrey', 'autumn', 'ava',
  'barbara', 'beatrice', 'becky', 'bella', 'beth', 'betty', 'beverly', 'bonnie', 'brenda', 'bridget', 'brittany', 'brooke',
  'caitlin', 'camille', 'candice', 'carmen', 'carol', 'caroline', 'carrie', 'casey', 'cassandra', 'catherine', 'cathy', 'cecilia', 'charlotte', 'chelsea', 'cheryl', 'christina', 'christine', 'cindy', 'claire', 'clara', 'claudia', 'colleen', 'connie', 'constance', 'courtney', 'crystal', 'cynthia',
  'daisy', 'danielle', 'darlene', 'dawn', 'debbie', 'deborah', 'debra', 'denise', 'diana', 'diane', 'dolores', 'donna', 'doris', 'dorothy',
  'edith', 'edna', 'eileen', 'elaine', 'eleanor', 'elena', 'elizabeth', 'ella', 'ellen', 'emily', 'emma', 'erica', 'erin', 'esther', 'ethel', 'eva', 'evelyn',
  'faith', 'faye', 'felicia', 'florence', 'frances', 'francesca',
  'gail', 'georgia', 'geraldine', 'gertrude', 'gina', 'gladys', 'gloria', 'grace', 'gwendolyn',
  'hannah', 'harriet', 'hazel', 'heather', 'heidi', 'helen', 'henrietta', 'hillary', 'holly', 'hope',
  'ida', 'irene', 'iris', 'irma', 'isabella', 'ivy',
  'jackie', 'jacqueline', 'jade', 'jane', 'janet', 'janice', 'jasmine', 'jean', 'jeanette', 'jennifer', 'jenny', 'jessica', 'jill', 'joan', 'joanne', 'jocelyn', 'jodi', 'jodie', 'josephine', 'joy', 'joyce', 'judith', 'judy', 'julia', 'juliana', 'julie', 'june', 'justine',
  'karen', 'kate', 'katherine', 'kathleen', 'kathryn', 'katie', 'kayla', 'kelly', 'kendra', 'kimberly', 'kristen', 'kristin', 'kristina',
  'laura', 'lauren', 'leah', 'lillian', 'lily', 'linda', 'lindsay', 'lisa', 'lois', 'loretta', 'lori', 'lorraine', 'louise', 'lucia', 'lucille', 'lucy', 'lydia', 'lynn',
  'mabel', 'mackenzie', 'madeline', 'madison', 'maggie', 'marcia', 'margaret', 'marguerite', 'maria', 'marian', 'marie', 'marilyn', 'marjorie', 'marlene', 'marsha', 'martha', 'mary', 'maureen', 'maxine', 'megan', 'melanie', 'melissa', 'meredith', 'michelle', 'mildred', 'miranda', 'miriam', 'molly', 'monica', 'muriel', 'myrtle',
  'nadine', 'nancy', 'naomi', 'natalie', 'natasha', 'nellie', 'nicole', 'nina', 'nora', 'norma',
  'olive', 'olivia', 'opal',
  'paige', 'pamela', 'patricia', 'patsy', 'paula', 'pauline', 'pearl', 'peggy', 'penelope', 'penny', 'phyllis', 'priscilla',
  'rachel', 'ramona', 'rebecca', 'regina', 'renee', 'rhonda', 'rita', 'roberta', 'robin', 'rochelle', 'rosa', 'rose', 'rosemary', 'ruby', 'ruth',
  'sabrina', 'sally', 'samantha', 'sandra', 'sandy', 'savannah', 'scarlett', 'shannon', 'sharon', 'sheila', 'shelby', 'shelly', 'sheryl', 'shirley', 'sierra', 'silvia', 'simone', 'sofia', 'sonia', 'sophia', 'stacey', 'stella', 'stephanie', 'sue', 'summer', 'susan', 'suzanne', 'sylvia',
  'tamara', 'tammy', 'tanya', 'tara', 'teresa', 'terri', 'thelma', 'theresa', 'tiffany', 'tina', 'tracy', 'tricia',
  'ursula',
  'valerie', 'vanessa', 'vera', 'veronica', 'vicki', 'victoria', 'violet', 'virginia', 'vivian',
  'wanda', 'wendy', 'whitney', 'wilma', 'winifred',
  'yvonne',
  'zoe', 'zoey'
])

// International names (French, German, Spanish, Italian, etc.)
export const INTERNATIONAL_FIRST_NAMES = new Set([
  // French
  'alain', 'antoine', 'arnaud', 'benoit', 'cedric', 'christophe', 'damien', 'didier', 'dominique', 'emmanuel', 'etienne', 'fabien', 'fabrice', 'florian', 'francois', 'frederic', 'guillaume', 'herve', 'jacques', 'jean', 'julien', 'laurent', 'lionel', 'loic', 'luc', 'marc', 'mathieu', 'michel', 'nicolas', 'olivier', 'pascal', 'patrice', 'philippe', 'remi', 'renaud', 'sebastien', 'stephane', 'sylvain', 'thierry', 'xavier', 'yannick', 'yves',
  'amelie', 'anais', 'aurelie', 'brigitte', 'camille', 'celine', 'chantal', 'christelle', 'claire', 'corinne', 'delphine', 'elise', 'emilie', 'elodie', 'estelle', 'genevieve', 'helene', 'isabelle', 'julie', 'juliette', 'laetitia', 'laurence', 'lea', 'lucie', 'manon', 'margot', 'marine', 'marion', 'martine', 'mathilde', 'monique', 'nathalie', 'odette', 'paulette', 'simone', 'solange', 'sophie', 'sylvie', 'valerie', 'veronique', 'virginie',
  // German
  'andreas', 'bernhard', 'christian', 'dieter', 'dirk', 'ernst', 'florian', 'franz', 'friedrich', 'gunter', 'hans', 'heinrich', 'helmut', 'horst', 'joachim', 'johann', 'jurgen', 'klaus', 'lothar', 'ludwig', 'manfred', 'markus', 'matthias', 'max', 'moritz', 'otto', 'peter', 'rainer', 'reinhard', 'rolf', 'rudolf', 'stefan', 'tobias', 'uwe', 'werner', 'wilhelm', 'wolfgang',
  'angelika', 'anna', 'annette', 'antje', 'bettina', 'birgit', 'christa', 'claudia', 'cornelia', 'dagmar', 'daniela', 'doris', 'elke', 'eva', 'gabi', 'gabriele', 'gerda', 'gisela', 'gudrun', 'hannelore', 'heide', 'heike', 'helga', 'hildegard', 'ilse', 'inge', 'ingrid', 'irene', 'karin', 'katja', 'lieselotte', 'margarete', 'maria', 'marianne', 'marlies', 'martina', 'monika', 'petra', 'regina', 'renate', 'sabine', 'sandra', 'sigrid', 'silke', 'simone', 'sonja', 'susanne', 'ulrike', 'ursula', 'ute',
  // Spanish
  'alejandro', 'alfonso', 'alvaro', 'andres', 'antonio', 'arturo', 'carlos', 'cesar', 'cristian', 'diego', 'eduardo', 'enrique', 'ernesto', 'esteban', 'felipe', 'fernando', 'francisco', 'gerardo', 'gonzalo', 'guillermo', 'gustavo', 'hector', 'hernando', 'hugo', 'ignacio', 'javier', 'jorge', 'jose', 'juan', 'julio', 'lorenzo', 'luis', 'manuel', 'marcos', 'martin', 'mateo', 'miguel', 'nicolas', 'oscar', 'pablo', 'pedro', 'rafael', 'ramon', 'raul', 'ricardo', 'roberto', 'rodrigo', 'ruben', 'santiago', 'sergio', 'victor',
  'adriana', 'alejandra', 'alicia', 'ana', 'andrea', 'angela', 'beatriz', 'blanca', 'carla', 'carmen', 'carolina', 'catalina', 'claudia', 'cristina', 'daniela', 'diana', 'elena', 'elisa', 'elvira', 'esperanza', 'esther', 'eva', 'gabriela', 'gloria', 'graciela', 'guadalupe', 'ines', 'irene', 'isabel', 'josefina', 'juana', 'julia', 'laura', 'leticia', 'lourdes', 'lucia', 'luisa', 'luz', 'magdalena', 'margarita', 'maria', 'marina', 'marta', 'mercedes', 'monica', 'natalia', 'nuria', 'olga', 'paloma', 'patricia', 'paula', 'pilar', 'raquel', 'rocio', 'rosa', 'rosario', 'sandra', 'silvia', 'sofia', 'soledad', 'susana', 'teresa', 'valentina', 'veronica', 'victoria', 'virginia', 'yolanda',
  // Italian
  'alessandro', 'andrea', 'angelo', 'bruno', 'claudio', 'daniele', 'davide', 'domenico', 'emanuele', 'enrico', 'fabio', 'filippo', 'francesco', 'giacomo', 'gianluca', 'gianmarco', 'giorgio', 'giovanni', 'giuseppe', 'luca', 'luigi', 'marco', 'mario', 'massimo', 'matteo', 'maurizio', 'michele', 'nicola', 'paolo', 'piero', 'pietro', 'raffaele', 'riccardo', 'roberto', 'salvatore', 'simone', 'stefano', 'vincenzo', 'vittorio',
  'alessandra', 'alessia', 'angela', 'anna', 'antonella', 'beatrice', 'carla', 'carlotta', 'caterina', 'chiara', 'cinzia', 'claudia', 'cristina', 'daniela', 'donatella', 'elena', 'eleonora', 'elisabetta', 'emanuela', 'federica', 'francesca', 'gabriella', 'giada', 'giorgia', 'giovanna', 'giulia', 'ilaria', 'laura', 'lucia', 'luisa', 'mara', 'maria', 'marina', 'martina', 'michela', 'monica', 'paola', 'patrizia', 'raffaella', 'roberta', 'rossella', 'sara', 'serena', 'silvia', 'simona', 'sofia', 'stefania', 'tiziana', 'valentina', 'vanessa', 'veronica'
])

// Titles and honorifics that precede names
export const NAME_PREFIXES = [
  'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'miss', 'dr', 'dr.', 'prof', 'prof.',
  'professor', 'sir', 'madam', 'madame', 'mme', 'mlle',
  'eng', 'eng.', 'engr', 'engr.', 'engineer',
  'sheikh', 'shaikh', 'prince', 'princess', 'emir',
  'dear', 'hi', 'hello', 'hey',
  'signed', 'regards', 'sincerely', 'from', 'to', 'attn', 'attention',
  'cc', 'bcc', 'contact', 'name', 'author', 'by', 'prepared by', 'submitted by',
  'manager', 'director', 'ceo', 'cto', 'cfo', 'vp', 'president', 'chairman'
]

// Combine all first names into one set for quick lookup
export const ALL_FIRST_NAMES = new Set([
  ...ARABIC_FIRST_NAMES,
  ...WESTERN_FIRST_NAMES,
  ...INTERNATIONAL_FIRST_NAMES
])

// Check if a word is a known first name
export function isKnownFirstName(word: string): boolean {
  return ALL_FIRST_NAMES.has(word.toLowerCase())
}

// Check if a word is a known Arabic family name
export function isKnownArabicFamilyName(word: string): boolean {
  const lower = word.toLowerCase()
  // Handle "Al-" prefix variations
  if (lower.startsWith('al') || lower.startsWith('el')) {
    const withoutPrefix = lower.replace(/^(al-?|el-?)/, '')
    return ARABIC_FAMILY_NAMES.has(lower) || ARABIC_FAMILY_NAMES.has(withoutPrefix)
  }
  return ARABIC_FAMILY_NAMES.has(lower)
}

// Check if a word is a name prefix/title
export function isNamePrefix(word: string): boolean {
  return NAME_PREFIXES.includes(word.toLowerCase().replace(/[.:,]$/, ''))
}
