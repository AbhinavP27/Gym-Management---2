const makeMeal = (id, name, calories, timing, goal, portion) => ({
  id,
  name,
  calories,
  timing,
  goal,
  portion,
});

export const dietLibrary = [
  {
    id: "breakfast",
    name: "Breakfast",
    description: "Start the day with protein, fiber, and steady-release carbs.",
    meals: [
      makeMeal("oats-eggs", "Oats With Boiled Eggs", "420 kcal", "7:00 AM", "Lean muscle support", "1 bowl oats + 3 eggs"),
      makeMeal("paneer-toast", "Paneer Toast Stack", "390 kcal", "7:30 AM", "High-protein vegetarian breakfast", "2 slices + 120g paneer"),
      makeMeal("smoothie-bowl", "Protein Smoothie Bowl", "360 kcal", "8:00 AM", "Light digestion before work", "1 bowl"),
      makeMeal("idli-sambar", "Idli With Sambar", "340 kcal", "8:00 AM", "Balanced South Indian breakfast", "3 idlis + 1 cup sambar"),
      makeMeal("peanut-banana-toast", "Peanut Banana Toast", "410 kcal", "7:15 AM", "Quick energy and satiety", "2 toasts + 1 banana"),
    ],
  },
  {
    id: "mid-morning",
    name: "Mid-Morning",
    description: "Small meals to prevent energy crashes and control hunger.",
    meals: [
      makeMeal("greek-yogurt-fruit", "Greek Yogurt With Fruit", "220 kcal", "10:30 AM", "Protein and gut health", "1 cup"),
      makeMeal("sprout-salad", "Sprout Salad", "180 kcal", "11:00 AM", "Fiber and micronutrients", "1 medium bowl"),
      makeMeal("almonds-apple", "Almonds and Apple", "210 kcal", "10:45 AM", "Steady energy", "12 almonds + 1 apple"),
      makeMeal("lassi", "Unsweetened Lassi", "160 kcal", "11:00 AM", "Hydration and protein", "1 tall glass"),
      makeMeal("boiled-chana", "Boiled Chana Bowl", "240 kcal", "10:30 AM", "Vegetarian protein boost", "1 bowl"),
    ],
  },
  {
    id: "lunch",
    name: "Lunch",
    description: "Main recovery meal with protein, carbs, and vegetables.",
    meals: [
      makeMeal("chicken-rice", "Grilled Chicken With Rice", "620 kcal", "1:00 PM", "Muscle recovery", "180g chicken + 1 cup rice"),
      makeMeal("fish-meal", "Fish Meal Plate", "540 kcal", "1:30 PM", "Lean protein and omega support", "150g fish + rice + veggies"),
      makeMeal("dal-roti", "Dal, Roti, and Sabzi", "500 kcal", "1:15 PM", "Balanced vegetarian lunch", "2 rotis + dal + sabzi"),
      makeMeal("paneer-rice", "Paneer Rice Bowl", "580 kcal", "1:00 PM", "Vegetarian muscle gain", "150g paneer + rice"),
      makeMeal("quinoa-bowl", "Quinoa Power Bowl", "490 kcal", "1:30 PM", "High-fiber clean lunch", "1 large bowl"),
    ],
  },
  {
    id: "pre-workout",
    name: "Pre-Workout",
    description: "Light digesting fuel before training sessions.",
    meals: [
      makeMeal("banana-coffee", "Banana and Black Coffee", "150 kcal", "5:00 PM", "Quick pre-workout energy", "1 banana + 1 cup coffee"),
      makeMeal("rice-cakes", "Rice Cakes With Peanut Butter", "230 kcal", "4:45 PM", "Fast carbs plus a little fat", "3 cakes"),
      makeMeal("dates-whey", "Dates and Whey Shake", "280 kcal", "5:15 PM", "Fast fuel and protein", "4 dates + 1 scoop whey"),
      makeMeal("sweet-potato", "Boiled Sweet Potato", "190 kcal", "5:00 PM", "Stable training energy", "200g"),
      makeMeal("fruit-yogurt", "Fruit Yogurt Cup", "210 kcal", "4:30 PM", "Light and easy digestion", "1 cup"),
    ],
  },
  {
    id: "dinner",
    name: "Dinner",
    description: "Recovery-focused dinner to finish the day without heavy digestion.",
    meals: [
      makeMeal("chicken-soup", "Chicken Soup and Salad", "380 kcal", "8:30 PM", "Light recovery dinner", "1 bowl + salad"),
      makeMeal("paneer-wrap", "Paneer Wrap", "420 kcal", "8:15 PM", "Balanced vegetarian dinner", "2 wraps"),
      makeMeal("omelette-toast", "Veg Omelette and Toast", "360 kcal", "8:00 PM", "Protein-first dinner", "3 eggs + 2 toasts"),
      makeMeal("grilled-fish-veggies", "Grilled Fish and Veggies", "410 kcal", "8:30 PM", "Lean recovery", "150g fish + vegetables"),
      makeMeal("khichdi-curd", "Moong Khichdi With Curd", "390 kcal", "8:00 PM", "Easy digestion", "1 bowl + curd"),
    ],
  },
  {
    id: "hydration",
    name: "Hydration",
    description: "Daily hydration and recovery support recommendations.",
    meals: [
      makeMeal("water-target", "Daily Water Target", "0 kcal", "All day", "Hydration consistency", "3 to 4 liters"),
      makeMeal("electrolytes", "Electrolyte Drink", "45 kcal", "During workout", "Replace salts on hard sessions", "500 ml"),
      makeMeal("coconut-water", "Coconut Water", "50 kcal", "Post workout", "Recovery hydration", "1 bottle"),
      makeMeal("lemon-water", "Lemon Water", "10 kcal", "Morning", "Light digestive hydration", "1 glass"),
      makeMeal("buttermilk", "Spiced Buttermilk", "60 kcal", "Afternoon", "Cooling hydration option", "1 glass"),
    ],
  },
];
