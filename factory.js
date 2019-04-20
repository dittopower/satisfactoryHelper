let recipes = {};
const aside = document.getElementsByTagName("aside")[0];
const article = document.getElementsByTagName("article")[0];
const table = document.getElementsByTagName("table")[0];
let craftingtiers = 0;

fetch(`${location.protocol}//${location.host}/recipes.json`).then(
    (resp) => {
        console.info(resp);
        return resp.json();
    },
    (error) => {
        console.error(error);
        alert("Failed to load recipes.");
    }
).then(
    (packageJson) => {
        recipes = packageJson;
        const sidebar = document.createElement("ul");
        aside.appendChild(sidebar);

        calcTiers();

        let colourrange = 255 * 3 / craftingtiers;
        for (let recipe in recipes) {
            let entry = document.createElement("li");
            entry.textContent = `${recipe}`;
            let colours = calcTierColour(craftingtiers, recipes[recipe]["craftingtier"]);
            entry.style.background = `rgba(${colours["red"]},${colours["green"]},${colours["blue"]},0.5)`;
            sidebar.appendChild(entry);
        }
        aside.addEventListener("click", selectRecipe)
    }
);


function calcTierColour(totalTiers, thisTier) {
    let colourrange = 255 * 3 / totalTiers;
    let tierdistrib = totalTiers / 3;
    let colours = new Array();
    colours["red"] = 0;
    colours["green"] = 0;
    colours["blue"] = 0;

    if (thisTier < tierdistrib) {
        colours["green"] = thisTier / totalTiers * 127.5;
        colours["blue"] = thisTier / totalTiers * 127.5 + 127.5;
    } else if (thisTier < (tierdistrib * 2)) {
        colours["red"] = thisTier / totalTiers * 127.5;
        colours["green"] = thisTier / totalTiers * 127.5 + 127.5;
    } else {
        colours["red"] = thisTier / totalTiers * 127.5 + 127.5;
        colours["blue"] = thisTier / totalTiers * 127.5;
    }
    return colours;
}

let allowedCalcs = 6;
function calcTiers() {
    allowedCalcs--;
    let changed = 0;
    for (recipe in recipes) {
        let init = recipes[recipe]["craftingtier"];

        for (let comp in recipes[recipe]) {
            let num = 0;
              if(comp == "craftingtier"){
                break
              }
            for (let prop in recipes[recipe][comp]) {
                if (recipes[prop]) {
                    num = Math.max(num, 1, recipes[prop]["craftingtier"] + 1);
                }
            }
            if (recipes[recipe]["craftingtier"]) {
                if (init != num) {
                    console.log(`Setting '${recipe}' to tier ${Math.min(num, recipes[recipe]["craftingtier"])}`);
                    recipes[recipe]["craftingtier"] = Math.min(num, recipes[recipe]["craftingtier"]);
                }
            } else {
                console.log(`Setting '${recipe}' to tier ${num}`);
                recipes[recipe]["craftingtier"] = num;
            }
            craftingtiers = Math.max(num + 1, craftingtiers);
        }

        if (init != recipes[recipe]["craftingtier"]) {
            changed++;
        }
    }
    console.info(`Recalculated ${changed} crafting tiers.`);
    if (changed > 0 && allowedCalcs > 0) {
        calcTiers();
    }
}

function selectRecipe(event) {
    //     console.log("click",event);
    window.a = event;
    if (event.target.tagName == "LI") {
        let current = event.target.textContent;
        //         table.textContent=JSON.stringify(recipes[current]);
        let result = addRecipeStage(current, 1);
        console.log(current, JSON.stringify(result));

    }
}

function addRecipeStage(data, quantity) {
    let versions = [];

    let recipeOptions = recipes[data];
    for (let opt in recipeOptions) {
        if(!recipeOptions[opt] || recipeOptions[opt].constructor.name != "Object"){
            break;
        }
        let recipe = recipeOptions[opt];
        // For each version of the recipe
        const init = {};
        init[data] = quantity;
        let variations = [init];

//         determine the number of times this recipe needs to be executed.
        let multiple = Math.ceil(quantity/recipe["Makes"]);

        //         Get the component stages
        for (let component in recipe) {
            let localvariations = [];
            if (recipes[component]) {
                let subcomponents = addRecipeStage(component, recipe[component]*multiple);
                for (let thing in subcomponents) {
                    for (let item in variations) {
                        localvariations.push(jsonAdd({ ...variations[item] }, subcomponents[thing]));
                    }
                }
                variations = localvariations;
            }
        }
        versions = versions.concat(variations);


    }
    return versions;
}

function jsonAddProperty(property, to, from) {
    if (to[property]) {
        to[property] += from[property]
    } else {
        to[property] = from[property];
    }
    return to;
}
function jsonAdd(to, from) {
    for (let prop in from) {
        if (to[prop]) {
            to[prop] += from[prop];
        } else {
            to[prop] = from[prop];
        }
    }
    return to;
}
