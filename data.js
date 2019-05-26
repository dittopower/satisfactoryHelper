let postLoadFunc;
let dataSets = { "recipes": false, "machineRecipes": false };
let data = [];

function loadData(postLoad) {
    postLoadFunc = postLoad;
    let currentDataSet = getCurrentDataSet();
    let fetchArray = new Array();
    for (let entry in dataSets) {
        fetchArray.push(fetch(`${location.protocol}//${location.host}/${entry}.json`).then(
            (resp) => {
                console.info(resp);
                return resp.json();
            },
            (error) => {
                console.error(error);
                alert(`Failed to load ${entry}.`);
            }
        ).then(
            (packageJson) => {
                data[entry] = packageJson;
                dataSets[entry] = true;
                if (!currentDataSet) {
                    currentDataSet = entry;
                }
            }, (e) => {
                console.error(`Failed to load '${entry}', hiding failed set..`, e);
                dataSets[entry] = false;
            }
        ));
    }
    return Promise.all(fetchArray).then(() => {
        let tryUpdate = setCurrentDataSet(currentDataSet);
        return tryUpdate ? tryUpdate : postLoadFunc(dataSets);
    });
}

function setCurrentDataSet(name) {
    if (dataSets[name]) {
        currentDataSet = name;
    } else {
        throw error(`'${name}' is not a valid data set.`);
    }
    if (name != getCurrentDataSet()) {
        localStorage.setItem(`CurrentDataSet`, name);
        return postLoadFunc(dataSets);
    }
    return false;
}
function getCurrentDataSet() {
    return localStorage.getItem(`CurrentDataSet`);
}

function getRecipes() {
    return data[currentDataSet];
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
function getCurrentRecipe() {
    return localStorage.getItem(`CurrentRecipe`);
}
function setCurrentRecipe(recipe) {
    return localStorage.setItem(`CurrentRecipe`, recipe);
}
