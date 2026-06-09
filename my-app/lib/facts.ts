export interface PlaceFacts {
  name: string;
  facts: string[];
}

interface FamousPlace {
  lat: number;
  lng: number;
  name: string;
  country: string;
  facts: string[];
  radiusKm: number;
}

const FAMOUS_PLACES: FamousPlace[] = [
  {
    name: "Tokyo",
    country: "Japan",
    lat: 35.6762, lng: 139.6503, radiusKm: 60,
    facts: [
      "Tokyo was originally a small fishing village called Edo before becoming the de facto capital in 1603.",
      "The Tokyo Metro serves over 8 million passengers daily, making it one of the busiest subway systems in the world.",
      "Shinjuku Station holds the Guinness World Record for the busiest train station with over 3.5 million passengers per day.",
      "Tokyo has more Michelin-starred restaurants than any other city in the world.",
      "The city has over 3,000 vending machines per square kilometer, the highest density on Earth.",
    ],
  },
  {
    name: "Japan",
    country: "Japan",
    lat: 36.2048, lng: 138.2529, radiusKm: 800,
    facts: [
      "Japan consists of 14,125 islands, making it one of the world's largest archipelagos.",
      "Mount Fuji is an active stratovolcano that last erupted in 1707.",
      "Japan has the third-largest economy in the world by nominal GDP.",
      "The Japanese writing system uses three scripts: Kanji, Hiragana, and Katakana.",
      "Japan experiences over 1,500 earthquakes per year, though most are too mild to feel.",
    ],
  },
  {
    name: "New York City",
    country: "America",
    lat: 40.7128, lng: -74.006, radiusKm: 40,
    facts: [
      "New York City has over 800 languages spoken, making it the most linguistically diverse city in the world.",
      "Central Park is larger than the principality of Monaco.",
      "The Statue of Liberty was a gift from France and arrived in 350 pieces across 214 crates.",
      "Times Square was originally called Longacre Square before being renamed in 1904.",
      "The NYC subway system has 472 stations, more than any other metro system in the world.",
    ],
  },
  {
    name: "London",
    country: "United Kingdom",
    lat: 51.5074, lng: -0.1278, radiusKm: 40,
    facts: [
      "London has four UNESCO World Heritage Sites: the Tower of London, Maritime Greenwich, Westminster Palace, and Kew Gardens.",
      "The London Underground opened in 1863 and is the world's oldest underground railway network.",
      "Big Ben is actually the nickname for the Great Bell inside the Elizabeth Tower, not the tower itself.",
      "Over 300 languages are spoken in London, making it one of the most multilingual cities in the world.",
      "The River Thames was once declared biologically dead in 1957 but is now one of the cleanest rivers in Europe.",
    ],
  },
  {
    name: "Paris",
    country: "France",
    lat: 48.8566, lng: 2.3522, radiusKm: 30,
    facts: [
      "The Eiffel Tower was originally built as a temporary entrance arch for the 1889 World's Fair and was nearly demolished in 1909.",
      "Paris has only one stop sign in the entire city, located near a building materials company.",
      "The Louvre Museum is the world's largest museum and houses approximately 38,000 objects.",
      "Paris was originally a Roman city called Lutetia before being renamed in the 3rd century.",
      "There are over 6,100 streets in Paris, and the shortest one is only 5.7 meters long.",
    ],
  },
  {
    name: "Sydney",
    country: "Australia",
    lat: -33.8688, lng: 151.2093, radiusKm: 40,
    facts: [
      "The Sydney Opera House has over 1 million roof tiles arranged in a distinctive sail-like pattern.",
      "Sydney Harbour Bridge is the world's largest steel arch bridge, measuring 503 meters long.",
      "Bondi Beach was named from an Aboriginal word meaning 'water breaking over rocks'.",
      "Sydney is home to the world's oldest surviving suburban train line, opened in 1855.",
      "The Royal Botanic Garden in Sydney is the oldest scientific institution in Australia, established in 1816.",
    ],
  },
  {
    name: "Beijing",
    country: "China",
    lat: 39.9042, lng: 116.4074, radiusKm: 50,
    facts: [
      "The Forbidden City has 9,999 rooms — one short of the mythical 10,000 rooms reserved for heaven.",
      "Beijing is one of the oldest inhabited cities in the world, with over 3,000 years of recorded history.",
      "The Great Wall of China stretches over 21,000 kilometers across northern China.",
      "Beijing's Subway is the busiest in the world, serving over 10 million passengers daily.",
      "The Temple of Heaven features a circular wall known as the Echo Wall that can transmit sound over 200 meters.",
    ],
  },
  {
    name: "Shanghai",
    country: "China",
    lat: 31.2304, lng: 121.4737, radiusKm: 40,
    facts: [
      "Shanghai has the world's longest metro system, spanning over 800 kilometers of track.",
      "The Bund in Shanghai was once known as the 'Wall Street of Asia' in the early 20th century.",
      "Shanghai Tower is China's tallest building at 632 meters, with the world's second-fastest elevator.",
      "Shanghai Disneyland is the only Disney park with a Chinese garden and a pirate-themed land.",
      "The name Shanghai literally means 'Upon the Sea' in Chinese.",
    ],
  },
  {
    name: "Los Angeles",
    country: "America",
    lat: 34.0522, lng: -118.2437, radiusKm: 50,
    facts: [
      "Los Angeles is the only city in North America to have hosted the Summer Olympics twice (1932 and 1984).",
      "The Hollywood Sign originally read 'Hollywoodland' and was a real estate advertisement.",
      "LA has the largest museum in the American West—the Getty Center—perched atop a hill in Brentwood.",
      "The Los Angeles Aqueduct carries water over 400 kilometers from the Owens Valley to the city.",
      "Los Angeles has over 2,700 distinct street murals, more than any other city in the US.",
    ],
  },
  {
    name: "Rome",
    country: "Italy",
    lat: 41.9028, lng: 12.4964, radiusKm: 30,
    facts: [
      "Rome is over 2,700 years old, founded in 753 BC according to legend.",
      "The Colosseum could hold up to 80,000 spectators and had a retractable awning system called the velarium.",
      "Rome has over 900 churches, more churches per square kilometer than any other city.",
      "The Trevi Fountain collects about 3,000 euros in coins every day, which is donated to charity.",
      "Modern Rome has a miniature country inside it: Vatican City, the world's smallest independent state.",
    ],
  },
  {
    name: "Egypt",
    country: "Egypt",
    lat: 26.8206, lng: 30.8025, radiusKm: 600,
    facts: [
      "The Great Pyramid of Giza was the tallest man-made structure in the world for over 3,800 years.",
      "Ancient Egyptians invented one of the first writing systems: hieroglyphics, dating back to 3200 BC.",
      "The Nile River is the longest river in the world, flowing over 6,650 kilometers through 11 countries.",
      "The Sphinx is carved from a single piece of limestone and is about 73 meters long.",
      "Ancient Egyptians used a calendar with 365 days, divided into 12 months of 30 days plus 5 extra days.",
    ],
  },
  {
    name: "Dubai",
    country: "UAE",
    lat: 25.2048, lng: 55.2708, radiusKm: 40,
    facts: [
      "Burj Khalifa is the world's tallest building at 828 meters, nearly twice the height of the Empire State Building.",
      "Dubai has a police fleet that includes a Lamborghini Aventador, a Ferrari FF, and a Bugatti Veyron.",
      "The Palm Jumeirah is the world's largest artificial island, visible from space.",
      "Dubai International Airport is the busiest airport in the world for international passengers.",
      "Dubai has the world's largest shopping mall, the Dubai Mall, spanning over 1 million square meters.",
    ],
  },
  {
    name: "San Francisco",
    country: "America",
    lat: 37.7749, lng: -122.4194, radiusKm: 30,
    facts: [
      "The Golden Gate Bridge took four years to build and opened in 1937, connecting San Francisco to Marin County.",
      "Alcatraz Island served as a federal prison for 29 years and never had a confirmed successful escape.",
      "San Francisco's cable cars are the only moving National Historic Landmark in the US.",
      "The city was almost completely destroyed by the 1906 earthquake and subsequent fire.",
      "San Francisco has the second-highest population density of any major US city, behind only New York City.",
    ],
  },
  {
    name: "Hong Kong",
    country: "China",
    lat: 22.3193, lng: 114.1694, radiusKm: 30,
    facts: [
      "Hong Kong has more skyscrapers than any other city in the world, with over 550 buildings taller than 150 meters.",
      "Hong Kong's public bus system carries over 4 million passengers daily across 400+ routes.",
      "The Star Ferry has been transporting passengers across Victoria Harbour since 1888.",
      "Hong Kong ranks among the world's most densely populated cities with over 6,500 people per square kilometer.",
      "Victoria Peak offers panoramic views of the city and is accessible via the Peak Tram, operating since 1888.",
    ],
  },
  {
    name: "Rio de Janeiro",
    country: "Brazil",
    lat: -22.9068, lng: -43.1729, radiusKm: 30,
    facts: [
      "Christ the Redeemer statue stands 30 meters tall and was voted one of the New Seven Wonders of the World.",
      "Rio's Carnival is the largest carnival in the world, attracting over 2 million people per day on the streets.",
      "Sugarloaf Mountain is over 600 million years old, dating back to the Precambrian era.",
      "Maracanã Stadium once held nearly 200,000 spectators for the 1950 World Cup final.",
      "The Tijuca Forest within Rio is the world's largest urban forest, covering nearly 40 square kilometers.",
    ],
  },
  {
    name: "Moscow",
    country: "Russia",
    lat: 55.7558, lng: 37.6173, radiusKm: 40,
    facts: [
      "The Moscow Metro is renowned for its ornate architecture, with many stations designed like art museums.",
      "St. Basil's Cathedral was commissioned by Ivan the Terrible and legend says he had the architect blinded.",
      "The Kremlin is the largest active fortress in Europe, encompassing 28 hectares.",
      "Moscow has the highest number of billionaires of any city in the world.",
      "Red Square got its name not from communism but from the Old Russian word 'krasnyi' meaning 'beautiful'.",
    ],
  },
  {
    name: "Bangkok",
    country: "Thailand",
    lat: 13.7563, lng: 100.5018, radiusKm: 30,
    facts: [
      "Bangkok's ceremonial name is 'Krung Thep Mahanakhon Amon Rattanakosin Mahinthara Ayuthaya Mahadilok Phop Noppharat Ratchathani Burirom Udomratchaniwet Mahasathan Amon Piman Awatan Sathit Sakkathattiya Witsanukam Prasit'.",
      "Bangkok has over 400 Buddhist temples called 'wats', with Wat Phra Kaew being the most sacred.",
      "The floating markets of Bangkok have operated for over 200 years along the city's extensive canal network.",
      "Bangkok is the world's most visited city, welcoming over 22 million international visitors annually.",
      "The Grand Palace was built in 1782 and served as the royal residence for over 150 years.",
    ],
  },
  {
    name: "Istanbul",
    country: "Türkiye",
    lat: 41.0082, lng: 28.9784, radiusKm: 30,
    facts: [
      "Istanbul is the only city in the world that straddles two continents: Europe and Asia.",
      "The Hagia Sophia was built in 537 AD and was the world's largest cathedral for nearly 1,000 years.",
      "The Grand Bazaar has over 4,000 shops spread across 61 covered streets.",
      "Istanbul was known as Constantinople for over 1,600 years before being renamed in 1930.",
      "The Basilica Cistern is an ancient underground water storage system built in 532 AD, capable of holding 80,000 cubic meters of water.",
    ],
  },
  {
    name: "Singapore",
    country: "Singapore",
    lat: 1.3521, lng: 103.8198, radiusKm: 30,
    facts: [
      "Singapore is a city-state made up of 63 islands, with the main island covering about 90% of its land area.",
      "The Marina Bay Sands hotel features a 150-meter infinity pool on its 57th floor, the world's largest rooftop pool.",
      "Singapore has four official languages: English, Mandarin, Malay, and Tamil.",
      "The Singapore Botanic Gardens is the only tropical botanic garden to be a UNESCO World Heritage Site.",
      "Chewing gum has been banned in Singapore since 1992, with strict fines for importing or selling it.",
    ],
  },
  {
    name: "Pyramids of Giza",
    country: "Egypt",
    lat: 29.9792, lng: 31.1342, radiusKm: 10,
    facts: [
      "The Great Pyramid was originally covered in polished white limestone casing stones that reflected the sun like a mirror.",
      "The pyramids were built approximately 4,500 years ago, predating the Roman Empire by over 2,500 years.",
      "The Great Pyramid's base is a near-perfect square with sides that vary by only 58 millimeters.",
      "Despite being one of the most studied monuments, no one knows exactly how the pyramids were constructed.",
      "The pyramid complex includes the Sphinx, which was carved from a single limestone ridge.",
    ],
  },
  {
    name: "São Paulo",
    country: "Brazil",
    lat: -23.5505, lng: -46.6333, radiusKm: 40,
    facts: [
      "São Paulo is the largest city in the Americas south of the equator, with over 12 million people.",
      "The city has the largest helicopter fleet in the world outside of New York and Tokyo.",
      "São Paulo's Municipal Market features a famous stained-glass dome and over 1,500 vendors.",
      "Avenida Paulista is one of the most important financial centers in Latin America.",
      "The city has over 120 museums, including the São Paulo Museum of Art, known for its iconic red architecture.",
    ],
  },
  {
    name: "Mount Everest",
    country: "Nepal",
    lat: 27.9881, lng: 86.925, radiusKm: 30,
    facts: [
      "Mount Everest grows approximately 4 millimeters taller every year due to tectonic plate movement.",
      "The mountain is named after Sir George Everest, a British surveyor who never actually saw the peak.",
      "The summit of Everest is made of marine limestone that was once at the bottom of the Tethys Ocean.",
      "The wind at Everest's summit can reach speeds of over 200 kilometers per hour.",
      "More than 300 climbers have died on Everest, and many bodies remain on the mountain due to the difficulty of recovery.",
    ],
  },
  {
    name: "Antarctica",
    country: "Antarctica",
    lat: -82.8628, lng: 135, radiusKm: 1500,
    facts: [
      "Antarctica is the coldest, windiest, driest continent on Earth, with recorded temperatures dropping below -89°C.",
      "The Antarctic Ice Sheet holds about 60% of the world's fresh water.",
      "There are no permanent human residents in Antarctica, only rotating scientists and support staff.",
      "The continent has no time zone and no native land mammals, birds, or reptiles.",
      "Antarctica was discovered in 1820, but the first confirmed landing wasn't until 1895.",
    ],
  },
  {
    name: "Grand Canyon",
    country: "America",
    lat: 36.1069, lng: -112.1129, radiusKm: 50,
    facts: [
      "The Grand Canyon is over 2 billion years old, with rocks at the bottom dating to the Precambrian era.",
      "The canyon is 446 kilometers long, up to 29 kilometers wide, and over 1,800 meters deep.",
      "The Colorado River has been carving the canyon for 5 to 6 million years.",
      "Despite its massive size, the Grand Canyon was not a national park until 1919.",
      "The canyon experiences about 5 million visitors per year, making it one of the most visited natural wonders.",
    ],
  },
  {
    name: "Berlin",
    country: "Germany",
    lat: 52.52, lng: 13.405, radiusKm: 30,
    facts: [
      "Berlin has more bridges than Venice — approximately 1,700 bridges within its city limits.",
      "The Berlin Wall fell on November 9, 1989, and remnants of it now serve as an open-air art gallery.",
      "Berlin's Museum Island is a UNESCO World Heritage site with five world-renowned museums.",
      "Berlin is home to the world's largest railway station, Berlin Hauptbahnhof, spanning five levels.",
      "The Brandenburg Gate was once part of the Berlin Wall and symbolized the division of Germany.",
    ],
  },
  {
    name: "Alps",
    country: "Europe",
    lat: 46.8182, lng: 8.2275, radiusKm: 300,
    facts: [
      "The Alps stretch across eight countries: France, Monaco, Italy, Switzerland, Liechtenstein, Germany, Austria, and Slovenia.",
      "Mont Blanc is the highest peak in the Alps at 4,808 meters, on the French-Italian border.",
      "The Alps are approximately 44 million years old, formed by the collision of the African and Eurasian tectonic plates.",
      "The Alps contain about 50,000 kilometers of marked hiking trails and 4,000 glaciers.",
      "The Matterhorn is one of the most photographed mountains in the world and inspired Disneyland's Matterhorn ride.",
    ],
  },
  {
    name: "South Africa",
    country: "South Africa",
    lat: -30.5595, lng: 22.9375, radiusKm: 800,
    facts: [
      "South Africa has three capital cities: Pretoria (administrative), Cape Town (legislative), and Bloemfontein (judicial).",
      "Table Mountain in Cape Town is one of the oldest mountains in the world, at over 260 million years old.",
      "South Africa has 11 official languages, including Zulu, Xhosa, Afrikaans, and English.",
      "The country is the only place in the world where a penguin colony can be found near a major city (Boulders Beach).",
      "South Africa was the first African country to host the FIFA World Cup in 2010.",
    ],
  },
  {
    name: "India",
    country: "India",
    lat: 20.5937, lng: 78.9629, radiusKm: 1000,
    facts: [
      "India is the world's most populous country, with over 1.4 billion people.",
      "The Taj Mahal was built by Emperor Shah Jahan as a mausoleum for his wife and took 22 years to complete.",
      "India has 22 official languages, with Hindi and English serving as the primary languages of government.",
      "The Bengal tiger is India's national animal and is found in over 50 tiger reserves across the country.",
      "India is the birthplace of four major world religions: Hinduism, Buddhism, Jainism, and Sikhism.",
    ],
  },
  {
    name: "Australia",
    country: "Australia",
    lat: -25.2744, lng: 133.7751, radiusKm: 1200,
    facts: [
      "The Great Barrier Reef is the world's largest coral reef system, stretching over 2,300 kilometers.",
      "Uluru (Ayers Rock) is a massive sandstone monolith that stands 348 meters tall and is sacred to Indigenous Australians.",
      "Australia has over 10,000 beaches — more than any other country — and you could visit a different one every day for 27 years.",
      "The Australian Alps receive more snowfall than the Swiss Alps.",
      "Kangaroos and emus were chosen for the national coat of arms because they cannot easily walk backward, symbolizing progress.",
    ],
  },
  {
    name: "Amazon Rainforest",
    country: "South America",
    lat: -3.4653, lng: -62.2159, radiusKm: 1000,
    facts: [
      "The Amazon Rainforest produces approximately 20% of the world's oxygen, earning it the nickname 'the lungs of the Earth'.",
      "The Amazon River is the largest river by discharge volume in the world, carrying more water than the next seven largest rivers combined.",
      "The Amazon basin spans 9 countries and covers about 40% of South America.",
      "An estimated 10% of all known species on Earth live in the Amazon Rainforest.",
      "The Amazon has over 2.5 million species of insects, with 90% of them still undiscovered by science.",
    ],
  },
  {
    name: "Brazil",
    country: "Brazil",
    lat: -14.235, lng: -51.9253, radiusKm: 1200,
    facts: [
      "Brazil is the fifth-largest country in the world by both area and population.",
      "Portuguese is the official language, making it the largest Portuguese-speaking country in the world.",
      "Brazil won the FIFA World Cup a record five times (1958, 1962, 1970, 1994, 2002).",
      "The Amazon River flows through Brazil and is the second-longest river in the world after the Nile.",
      "Brazil's Carnival in Rio de Janeiro attracts over 2 million people per day during the celebration.",
    ],
  },
  {
    name: "Mexico City",
    country: "Mexico",
    lat: 19.4326, lng: -99.1332, radiusKm: 30,
    facts: [
      "Mexico City was built on top of the ancient Aztec capital of Tenochtitlán, founded in 1325.",
      "The city sinks approximately 20 centimeters per year because it's built on a drained lakebed.",
      "Mexico City's Metropolitan Cathedral is the largest cathedral in the Americas.",
      "The city has more museums than any other city in the world, with over 150 museums.",
      "Chapultepec Park in Mexico City is nearly twice the size of New York's Central Park.",
    ],
  },
  {
    name: "Canada",
    country: "Canada",
    lat: 56.1304, lng: -106.3468, radiusKm: 1500,
    facts: [
      "Canada has the longest coastline of any country in the world, spanning over 202,000 kilometers.",
      "The Canadian Rockies contain some of the oldest rock formations on Earth, dating back over 1 billion years.",
      "Canada has more lakes than the rest of the world combined, with over 2 million lakes.",
      "Niagara Falls straddles the border between Canada and the US, with the Canadian side being the most visited.",
      "Canada is the second-largest country by land area but has a population of only about 40 million.",
    ],
  },
  {
    name: "Mariana Trench",
    country: "Pacific Ocean",
    lat: 11.3493, lng: 142.1996, radiusKm: 200,
    facts: [
      "The Mariana Trench is the deepest known point in Earth's oceans, reaching nearly 11,000 meters deep.",
      "The pressure at the bottom of the trench is over 1,000 times standard atmospheric pressure.",
      "Only three people have ever visited the Challenger Deep, the deepest part of the trench.",
      "Despite the extreme pressure, life exists at the bottom — including single-celled organisms and amphipods.",
      "The trench is located in the western Pacific Ocean and stretches about 2,550 kilometers long.",
    ],
  },
  {
    name: "Sahara Desert",
    country: "Africa",
    lat: 23.4162, lng: 25.6628, radiusKm: 1500,
    facts: [
      "The Sahara is the largest hot desert in the world, covering an area roughly the size of the United States.",
      "Despite its arid reputation, the Sahara has over 20 lakes and contains enormous underground water reserves.",
      "The desert experiences some of the most extreme temperature swings on Earth, from 50°C in the day to near freezing at night.",
      "About 2 million people live in the Sahara, primarily in oasis communities and nomadic tribes.",
      "The Sahara was once a lush green savanna with rivers and lakes, until about 5,000 years ago.",
    ],
  },
  {
    name: "Northern Europe",
    country: "Europe",
    lat: 60.472, lng: 8.4689, radiusKm: 800,
    facts: [
      "Norway has the longest road tunnel in the world — the Lærdal Tunnel stretches 24.5 kilometers.",
      "Sweden operates a 'hotel' deep in a mine — the Sala Silver Mine offers guests a stay 155 meters underground.",
      "Finland has over 188,000 lakes, covering about 10% of the country's total area.",
      "Denmark consists of 406 islands, though only about 70 are inhabited.",
      "Iceland has no standing army and is the only NATO member without a military force.",
    ],
  },
  {
    name: "Greece",
    country: "Greece",
    lat: 39.0742, lng: 21.8243, radiusKm: 400,
    facts: [
      "Greece has more than 2,000 islands, of which only about 170 are inhabited.",
      "The Parthenon in Athens has been under construction or restoration for more years than it was originally standing.",
      "Greece is the birthplace of democracy, Western philosophy, the Olympic Games, and modern theater.",
      "The Greek alphabet has been in continuous use for over 2,750 years, longer than any other alphabet.",
      "Santorini's iconic blue-domed churches were originally whitewashed to reflect heat and prevent disease.",
    ],
  },
  {
    name: "Peru",
    country: "Peru",
    lat: -9.19, lng: -75.0152, radiusKm: 600,
    facts: [
      "Machu Picchu was built around 1450 AD as an estate for the Inca emperor Pachacuti.",
      "The Andes Mountains in Peru are home to over 30 peaks exceeding 6,000 meters in elevation.",
      "Lake Titicaca is the highest navigable lake in the world, at 3,812 meters above sea level.",
      "Peru has 84 of the world's 117 life zones, making it one of the most biodiverse countries on Earth.",
      "The Nazca Lines are ancient geoglyphs spanning over 1,000 square kilometers, best viewed from the air.",
    ],
  },
  {
    name: "New Zealand",
    country: "New Zealand",
    lat: -40.9006, lng: 174.886, radiusKm: 400,
    facts: [
      "New Zealand was the last major landmass to be settled by humans, around 1300 AD.",
      "The country has more sheep than people, with about 6 sheep for every person.",
      "Mount Cook (Aoraki) is New Zealand's highest peak at 3,724 meters.",
      "New Zealand's mountains were used as filming locations for the Lord of the Rings trilogy.",
      "The country has no native land mammals except for bats and marine mammals.",
    ],
  },
  {
    name: "Great Wall of China",
    country: "China",
    lat: 40.4319, lng: 116.5704, radiusKm: 100,
    facts: [
      "The Great Wall is not a single wall but a series of fortifications built over 2,000 years.",
      "Contrary to popular belief, the Great Wall is not visible from space with the naked eye.",
      "The wall spans over 21,000 kilometers, making it the longest man-made structure in the world.",
      "Over 1 million workers died during its construction, giving it the nickname 'the longest cemetery on Earth'.",
      "The wall includes beacon towers that could send smoke signals across hundreds of kilometers in minutes.",
    ],
  },
  {
    name: "South Korea",
    country: "South Korea",
    lat: 35.9078, lng: 127.7669, radiusKm: 400,
    facts: [
      "South Korea has the fastest internet speeds in the world, averaging over 300 Mbps.",
      "The DMZ between North and South Korea is one of the most heavily fortified borders on Earth, spanning 250 kilometers.",
      "South Korea's Jeju Island was formed by volcanic eruptions about 2 million years ago.",
      "The country is the world leader in semiconductor manufacturing, producing over 50% of the world's memory chips.",
      "South Korea has a unique culture of 'ppalli-ppalli' (hurry-hurry), reflecting a deep cultural emphasis on speed and efficiency.",
    ],
  },
  {
    name: "Saudi Arabia",
    country: "Saudi Arabia",
    lat: 23.8859, lng: 45.0792, radiusKm: 800,
    facts: [
      "Saudi Arabia has no rivers or permanent lakes; it is one of the driest countries in the world.",
      "The Rub' al Khali (Empty Quarter) is the largest continuous sand desert on Earth, about the size of France.",
      "Saudi Arabia is the world's largest oil exporter, holding about 17% of the world's proven petroleum reserves.",
      "The Kingdom has the world's tallest sand dunes, reaching heights of over 300 meters.",
      "The country has been inhabited for over 20,000 years, with petroglyphs dating back to the Neolithic period.",
    ],
  },
  {
    name: "Philippines",
    country: "Philippines",
    lat: 12.8797, lng: 121.774, radiusKm: 600,
    facts: [
      "The Philippines is made up of 7,641 islands, of which only about 2,000 are inhabited.",
      "The Puerto Princesa Subterranean River features an 8.2-kilometer-long underground river that flows directly into the sea.",
      "The Philippines has the highest concentration of unique bird species per square kilometer of any country.",
      "Chocolate Hills in Bohol consist of over 1,200 conical hills that turn brown during the dry season, resembling chocolate mounds.",
      "The country is the world's second-largest producer of coconuts, after Indonesia.",
    ],
  },
  {
    name: "Inca Trail",
    country: "Peru",
    lat: -13.1631, lng: -72.545, radiusKm: 50,
    facts: [
      "The Inca Trail to Machu Picchu is part of a network of over 40,000 kilometers of roads built by the Inca Empire.",
      "The trail reaches an elevation of 4,215 meters at its highest point, known as Dead Woman's Pass.",
      "The Inca built their roads without the use of wheels, iron tools, or draft animals.",
      "Only 500 permits are issued per day for the trail, with 300 going to trekkers and 200 to guides and porters.",
      "The trail passes through diverse ecosystems, from cloud forests to alpine tundra, within just a few days.",
    ],
  },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findFamousPlace(
  lat: number,
  lng: number,
): FamousPlace | null {
  let closest: FamousPlace | null = null;
  let closestDist = Infinity;

  for (const place of FAMOUS_PLACES) {
    const dist = haversineKm(lat, lng, place.lat, place.lng);
    if (dist <= place.radiusKm && dist < closestDist) {
      closest = place;
      closestDist = dist;
    }
  }

  return closest;
}

export function getRandomFact(facts: string[]): string {
  return facts[Math.floor(Math.random() * facts.length)];
}

const NOMINATIM_BOUNDING_RADIUS_KM = 30;
const factCache = new Map<string, { facts: string[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24;

export function getCachedFact(
  lat: number,
  lng: number,
): PlaceFacts | null {
  for (const [key, value] of factCache) {
    const [cachedLat, cachedLng] = key.split(",").map(Number);
    if (
      haversineKm(lat, lng, cachedLat, cachedLng) < NOMINATIM_BOUNDING_RADIUS_KM &&
      Date.now() - value.timestamp < CACHE_TTL
    ) {
      return { name: key, facts: value.facts };
    }
  }
  return null;
}

export function setCachedFact(
  lat: number,
  lng: number,
  facts: string[],
): void {
  factCache.set(`${lat.toFixed(3)},${lng.toFixed(3)}`, {
    facts,
    timestamp: Date.now(),
  });
}
