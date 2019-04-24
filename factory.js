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
            let colours = calcTierColour(craftingtiers, getRecipe(recipe)["craftingtier"]);
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
            rows[entry][getRecipe(item)["craftingtier"]].appendChild(li);
        }
    }


    for (let entry in data) {
        let tr = document.createElement("tr");

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
    // TODO: linear colour spectrum
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
        let init = getRecipe(recipe)["craftingtier"];

        for (let comp in getRecipe(recipe)) {
            let num = 0;
            if (comp == "craftingtier") {
                break
            }
            for (let prop in getRecipeOption(recipe,comp)) {
                if (recipes[prop]) {
                    num = Math.max(num, 1, getRecipe(prop)["craftingtier"] + 1);
                }
            }
            if (getRecipe(recipe)["craftingtier"]) {
                if (init != num) {
                    getRecipe(recipe)["craftingtier"] = Math.min(num, getRecipe(recipe)["craftingtier"]);
                }
            } else {
                getRecipe(recipe)["craftingtier"] = num;
            }
            craftingtiers = Math.max(num + 1, craftingtiers);
        }

        if (init != getRecipe(recipe)["craftingtier"]) {
            changed++;
        }
    }
    console.info(`Recalculated ${changed} crafting tiers.`);
    if (changed > 0 && allowedCalcs > 0) {
        calcTiers();
    }
}

function selectRecipe(event) {
    // TODO: allow the disabling of certain alternate recipes
    if (event.target.tagName == "LI") {
        clearDisplay();
        // TODO: use worker for calculations
        window.requestIdleCallback(() => {
            let current = event.target.textContent;
            let result = addRecipeStage(current, outputQuantity.value);
            console.log(current, JSON.stringify(result));
            window.requestIdleCallback(() => { updateRecipeDisplay(result) });
        });
    }
}

function addRecipeStage(data, quantity) {
    let versions = [];

    let recipeOptions = getRecipe(data);
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
            if (getRecipe(component)) {
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

function getRecipe(data){
    return recipes[data];
}
function getRecipeOption(data,option){
    return getRecipe(data)[option];
}
function isRecipe(data){
    return !!getRecipe(data);
}
function isRecipeOption(data,option){
    return !!getRecipeOption(data,option);
}
function getRecipeCraftingTier(data){
    return localStorage.getItem(`${data}.CraftingTier`);
}
function setRecipeCraftingTier(data,tier){
    return localStorage.setItem(`${data}.CraftingTier`,tier);
}


function exploreRecipe(data, quantity) {
    console.warn("exploreRecipe",data)
    let versions = [];

    let recipeOptions = getRecipe(data);
    for (let opt in recipeOptions) {
        if (!recipeOptions[opt] || recipeOptions[opt].constructor.name != "Object") {
            break;
        }
        versions.push(exploreRecipeOption(data,quantity,opt))
    }
    console.warn(`exploreRecipe: '${data}'`, JSON.stringify(versions));
    return versions;
}

function exploreRecipeOption(data, quantity, option) {
    console.warn(`exploreRecipeOption: '${data}' Opt: '${option}'`);
    if (!isRecipe(data) || !isRecipeOption(data,option) || getRecipeOption(data,option).constructor.name != "Object") {
        throw new Error("Invalid Recipe Option");
    }

    let versions = [];
    let recipe = getRecipeOption(data,option);
    // Determine the number of times this recipe needs to be executed.
    let multiple = Math.ceil(quantity / recipe["Makes"]);
    versions.push({
            name: data,
            quantity: recipe["Makes"]*multiple,
            recipe: option
        });
    

    // Is this a harvest/gather or a craft?
    if(recipe["Harvest"]){
        console.log("harvest");
    }else{
        console.log("craft");
        versions.push(new Array());

        //         Get the ingredient stages
        for (let ingredient in recipe) {
            if (getRecipe(ingredient)) {
                let tempClone = Array.from(versions);
                versions[1] = new Array();

                let ingredientRecipes = exploreRecipe(ingredient, recipe[ingredient] * multiple);
                ingredientRecipes.forEach((res)=>{console.log("ingredientRecipes",JSON.stringify(res));});

                console.log("tempClone[1]",JSON.stringify(tempClone[1]));
                for (let ingredientOption = 0; ingredientOption < ingredientRecipes.length; ingredientOption++) {
                    console.log("ingredientOption",ingredientOption);
                    console.log("versions",JSON.stringify(versions));

                    // Additional Ingredients
                    for (let i = 0; i < ingredientRecipes[ingredientOption].length; i++){
                        if (ingredientRecipes[ingredientOption][i]){
                            let ref = i+1;
                            console.log("..joining", JSON.stringify(ingredientRecipes[ingredientOption][i]))

                            if(i == 0){
                                if((!tempClone[ref]) || tempClone[ref].length == 0){
                                    versions[ref].push( [ingredientRecipes[ingredientOption][i]]);
                                }else{
                                    for( let existing in  tempClone[ref]){
                                        versions[ref].push( (tempClone[ref][existing] ? tempClone[ref][existing] : []).concat([ingredientRecipes[ingredientOption][i]]));
                                    }
                                }

                            }else{
                                if((!versions[ref]) || versions[ref].length == 0){
                                    versions[ref] = [ingredientRecipes[ingredientOption][i]];
                                }else{
                                    versions[ref] = (versions[ref] ? versions[ref] : []).concat([ingredientRecipes[ingredientOption][i]]);
                                }
                            }
                        }
                    }

                }

            }
        }
    }
    
    console.warn(`exploreRecipeOption return: '${data}' Opt: '${option}'`, JSON.stringify(versions));
    return versions;
}

