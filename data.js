let postLoadFunc = () => { };
let dataSets = { "recipes": false, "machineRecipes": false };
let data = [];
let ready = false;
let urlQueryParams = new URLSearchParams(window.location.search);

function loadData(postLoad) {
    let currentDataSet = getCurrentDataSet();
    let fetchArray = new Array();
    for (let entry in dataSets) {
        fetchArray.push(fetch(`${location.protocol}//${location.host}/${entry}.json`).then(
            (resp) => {
                return resp.json();
            },
            (error) => {
                console.error(`Failed to load ${entry}.`, error);
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
        // Load shared link from url get params
        try {
            if (urlQueryParams.has("src")) {
                setCurrentDataSet(urlQueryParams.get("src"));
            }
            if (urlQueryParams.has("quantity")) {
                setCurrentQuanity(urlQueryParams.get("quantity"));
            }
            if (urlQueryParams.has("item")) {
                setCurrentRecipe(urlQueryParams.get("item"));
            }
        } catch (e) {
            console.error(`Error handling Query string.`, e);
        }
        ready=true;
    }).then(() => {
        if (!currentDataSet) {
            setCurrentDataSet(currentDataSet);
        }
        postLoadFunc = postLoad;
        return postLoadFunc(dataSets);
    });
}

function updateShareData() {
    changeShareData();
}
function setShareData() {
    changeShareData('replace');
}
function changeShareData(action) {
    if (!ready){
        return;
    }
    let state = {};

    let item = getCurrentRecipe();
    if (item) {
        state.item = item;
        urlQueryParams.set("item", item);
    }

    let quantity = getCurrentQuanity();
    if (quantity) {
        state.quantity = quantity;
        urlQueryParams.set("quantity", quantity);
    }

    let src = getCurrentDataSet();
    if (src) {
        state.src = src;
        urlQueryParams.set("src", src);
    }

    let title = document.title;
    let url = `?${urlQueryParams.toString()}`;
    if (action == 'replace') {
        window.history.replaceState(state, title, url);
    } else {
        window.history.pushState(state, title, url);
    }
}

function setCurrentDataSet(name) {
    if (!dataSets[name]) {
        throw error(`'${name}' is not a valid data set.`);
    }
    if (name != getCurrentDataSet()) {
        localStorage.setItem(`CurrentDataSet`, name);
        updateShareData();
        return postLoadFunc(dataSets);
    }
    return false;
}
function getCurrentDataSet() {
    return localStorage.getItem(`CurrentDataSet`);
}

function getRecipes() {
    return data[getCurrentDataSet()];
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
    localStorage.setItem(`CurrentRecipe`, recipe);
    updateShareData();
}
function getCurrentViewMode() {
    return localStorage.getItem(`CurrentViewMode`);
}
function setCurrentViewMode(mode) {
    return localStorage.setItem(`CurrentViewMode`, mode);
}
function getCurrentQuanity() {
    return Number.parseInt(localStorage.getItem(`CurrentQuanity`)) || 1;
}
function setCurrentQuanity(num) {
    localStorage.setItem(`CurrentQuanity`, num);
    setShareData();
}
