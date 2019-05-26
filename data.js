let recipes = {};
let machineRecipes = {};

function loadData() {
    return Promise.all([
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
                calcTiers();
                calcNumbers();
                calcTotal();

                runAsync(generateSideList);

                outputQuantity.addEventListener("change", selectRecipe);
                recipeTypeSelector.addEventListener("change", changeSource);
                // changeSource(recipeTypeSelector.value);
                functionTypeSelector.addEventListener("change", changeType);
                // changeType(functionTypeSelector.value);
                colourSchemeSelector.addEventListener("change", changeColours);
                // changeColours(colourSchemeSelector.value);
            }
        ),
        fetch(`${location.protocol}//${location.host}/machineRecipes.json`).then(
            (resp) => {
                console.info(resp);
                return resp.json();
            },
            (error) => {
                console.error(error);
                alert("Failed to load machineRecipes.");
            }
        ).then(
            (packageJson) => {
                machineRecipes = packageJson;
            }
        )
    ]);
}

function getRecipes() {
    if (currentRecipeMode == recipeModeList.machine) {
        return machineRecipes;
    }
    return recipes;
}
function getRecipe(data) {
    return getRecipes()[data];
}
function getRecipeOption(data, option) {
    return getRecipe(data)[option];
}
function isRecipe(data) {
    return !!getRecipe(data);
}
function isRecipeOption(data, option) {
    return !!getRecipeOption(data, option);
}
function getTotalCraftingTier() {
    return Number.parseInt(localStorage.getItem(`CraftingTier`)) || 0;
}
function setTotalCraftingTier(tier) {
    return localStorage.setItem(`CraftingTier`, tier);
}
function getRecipeCraftingTier(data) {
    return Number.parseInt(localStorage.getItem(`${data}.CraftingTier`));
}
function setRecipeCraftingTier(data, tier) {
    return localStorage.setItem(`${data}.CraftingTier`, tier);
}
function getRecipeOptionCraftingTier(data, option) {
    return Number.parseInt(localStorage.getItem(`${data}.${option}.CraftingTier`));
}
function setRecipeOptionCraftingTier(data, option, tier) {
    return localStorage.setItem(`${data}.${option}.CraftingTier`, tier);
}
function getRecipeOptionEnabled(recipe, option) {
    return false.toString() != localStorage.getItem(`${recipe}.${option}.Enabled`);
}
function setRecipeOptionEnabled(recipe, option, status) {
    return localStorage.setItem(`${recipe}.${option}.Enabled`, status.toString());
}
function getRecipeNumber(recipe) {
    return Number.parseInt(localStorage.getItem(`${recipe}.Number`));
}
function setRecipeNumber(recipe, num) {
    return localStorage.setItem(`${recipe}.Number`, num);
}
