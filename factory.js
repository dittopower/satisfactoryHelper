let recipes = {};
const aside = document.getElementsByTagName("aside")[0];
const outputQuantity = document.getElementById("quantity");
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

        for (let recipe in recipes) {
            let entry = document.createElement("li");
            entry.textContent = `${recipe}`;
            let colours = calcTierColour(craftingtiers, recipes[recipe]["craftingtier"]);
            entry.style.backgroundColor = `rgba(${colours["red"]},${colours["green"]},${colours["blue"]},0.5)`;
            sidebar.appendChild(entry);
        }
        aside.addEventListener("click", selectRecipe)
    }
);

function clearDisplay() {
    [...table.children].forEach((child) => {
        child.remove();
    })
}

function updateRecipeDisplay(data) {

    let rows = new Array(data.length);

    for (let entry in data) {
        // For each recipe possibility
        // Setup data structure
        rows[entry] = new Array(craftingtiers);
        for (let column = 0; column < craftingtiers; column++) {
            rows[entry][column] = document.createElement("ul");
        }

        // Populate
        let recipe = data[entry];
        for (let item in recipe) {
            // For ingredients in the recipe
            let li = document.createElement("li");
            li.textContent = `${item} ${recipe[item]}`;
            rows[entry][recipes[item]["craftingtier"]].appendChild(li);
        }
    }


    for (let entry in data) {
        let tr = document.createElement("tr");
        // for (let row = 0; row < craftingtiers; row++){
        //     a
        // }

        for (let column in rows[entry]) {
            if (rows[entry][column].childElementCount > 0) {
                let td = document.createElement("td");
                td.appendChild(rows[entry][column]);

                let colours = calcTierColour(craftingtiers, column);
                td.style.backgroundColor = `rgba(${colours["red"]},${colours["green"]},${colours["blue"]},0.7)`;

                tr.appendChild(td);
            }
        }

        table.appendChild(tr);
    }

    let hr = document.createElement("tr");
    for (let column = 0; column < craftingtiers; column++) {
        if (rows.some((row) => {
            if (row[column] && row[column].childElementCount > 0) {
                return true;
            }
            return false;
        })) {
            let th = document.createElement("th");
            th.textContent = `Crafting Tier ${column}`;
            hr.appendChild(th);
        }
    }
    table.insertBefore(hr, table.children[0]);


}


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
            if (comp == "craftingtier") {
                break
            }
            for (let prop in recipes[recipe][comp]) {
                if (recipes[prop]) {
                    num = Math.max(num, 1, recipes[prop]["craftingtier"] + 1);
                }
            }
            if (recipes[recipe]["craftingtier"]) {
                if (init != num) {
                    //                     console.log(`Setting '${recipe}' to tier ${Math.min(num, recipes[recipe]["craftingtier"])}`);
                    recipes[recipe]["craftingtier"] = Math.min(num, recipes[recipe]["craftingtier"]);
                }
            } else {
                //                 console.log(`Setting '${recipe}' to tier ${num}`);
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
    if (event.target.tagName == "LI") {
        clearDisplay();
        window.requestIdleCallback(() => {
            let current = event.target.textContent;
            //         table.textContent=JSON.stringify(recipes[current]);
            let result = addRecipeStage(current, outputQuantity.value);
            console.log(current, JSON.stringify(result));
            window.requestIdleCallback(() => { updateRecipeDisplay(result) });
        });
    }
}

function addRecipeStage(data, quantity) {
    let versions = [];

    let recipeOptions = recipes[data];
    for (let opt in recipeOptions) {
        if (!recipeOptions[opt] || recipeOptions[opt].constructor.name != "Object") {
            break;
        }
        let recipe = recipeOptions[opt];
        // For each version of the recipe
        const init = {};
        init[data] = quantity;
        let variations = [init];

        //         determine the number of times this recipe needs to be executed.
        let multiple = Math.ceil(quantity / recipe["Makes"]);

        //         Get the component stages
        for (let component in recipe) {
            let localvariations = [];
            if (recipes[component]) {
                let subcomponents = addRecipeStage(component, recipe[component] * multiple);
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
