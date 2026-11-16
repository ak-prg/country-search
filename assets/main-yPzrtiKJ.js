// \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
// src/core/debounce.ts
function debounce(fn, delay) {
	let timer;
	function debounceHandler(input) {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			fn(input);
		}, delay);
	}
	debounceHandler.cancel = () => {
		if (timer) clearTimeout(timer);
	};
	return debounceHandler;
}
// src/constants.ts
var BASE_URL = "https://countries.dev/name/";
var TIMEOUT = 1e4;
var LOC_STOR_KEY = "country-search";
// src/HttpError.ts
var HttpError = class extends Error {
	status;
	constructor(status) {
		super(`HTTP error: ${status}`);
		this.name = "HttpError";
		this.status = status;
	}
};
// src/core/searchCountries.ts
async function searchCountries(query, signal) {
	const res = await fetch(`${BASE_URL}${encodeURIComponent(query)}`, { signal });
	if (res.status === 404) return [];
	if (!res.ok) throw new HttpError(res.status);
	return await res.json();
}
// src/core/classifyError.ts
function classifyError(err) {
	if (!(err instanceof Error)) return "Something went wrong.";
	if (err.name === "AbortError") return "";
	if (err.name === "TimeoutError") return "The server took too long to respond.";
	if (err.name === "TypeError") return "Network error. Check your connection.";
	if (err.name === "SyntaxError") return "Received invalid data from the server.";
	if (err instanceof HttpError) return `Server error (${err.status}).`;
	return "Something went wrong.";
}
// src/core/search-utils.ts
var currentCallerCtrl;
var cache = /* @__PURE__ */ new Map();
function toAbort() {
	if (currentCallerCtrl) currentCallerCtrl.abort();
}
async function fetchWrapper(query) {
	const previousCtrl = currentCallerCtrl;
	const own = new AbortController();
	currentCallerCtrl = own;
	try {
		const result = cachedSearch(query, own.signal);
		if (previousCtrl) previousCtrl.abort();
		return {
			countries: await result,
			errorMessage: ""
		};
	} catch (err) {
		return {
			countries: null,
			errorMessage: classifyError(err)
		};
	}
}
async function cachedSearch(query, signal) {
	let entry = cache.get(query);
	if (!entry) entry = startRequest(query);
	entry.subscribers++;
	try {
		return await Promise.race([entry.promise, rejectOnAbort(signal)]);
	} catch (err) {
		if (!signal.aborted) cache.delete(query);
		throw err;
	} finally {
		entry.subscribers--;
		if (signal.aborted && entry.subscribers === 0) {
			entry.controller.abort();
			cache.delete(query);
		}
	}
}
function rejectOnAbort(signal) {
	return new Promise((_, reject) => {
		signal.addEventListener("abort", () => reject(signal.reason));
	});
}
function startRequest(query) {
	const fetchController = new AbortController();
	const entry = {
		promise: searchCountries(query, AbortSignal.any([fetchController.signal, AbortSignal.timeout(TIMEOUT)])),
		controller: fetchController,
		subscribers: 0
	};
	cache.set(query, entry);
	return entry;
}
// src/storage.ts
function fetchData() {
	try {
		return JSON.parse(localStorage.getItem("country-search") ?? "[]") ?? [];
	} catch {
		return [];
	}
}
function persistData(data) {
	localStorage.setItem(LOC_STOR_KEY, JSON.stringify(data));
}
// src/model.ts
var state = {};
var onChange$1;
function initState(stateCb) {
	onChange$1 = stateCb.onChangeDetected;
	state = {
		searchHistory: fetchData(),
		currentQuery: "",
		errorMessage: "",
		countries: [],
		status: "idle"
	};
}
function setState(patch) {
	state = {
		...state,
		...patch
	};
	onChange$1();
}
function updateHistory(query) {
	setState({ searchHistory: [...state.searchHistory.filter((q) => q !== query).slice(-9), query] });
	persistData(state.searchHistory);
}
var COUNTRY_NAMES = new Map([
	{
		name: "Afghanistan",
		alpha3Code: "AFG"
	},
	{
		name: "Åland Islands",
		alpha3Code: "ALA"
	},
	{
		name: "Albania",
		alpha3Code: "ALB"
	},
	{
		name: "Algeria",
		alpha3Code: "DZA"
	},
	{
		name: "American Samoa",
		alpha3Code: "ASM"
	},
	{
		name: "Andorra",
		alpha3Code: "AND"
	},
	{
		name: "Angola",
		alpha3Code: "AGO"
	},
	{
		name: "Anguilla",
		alpha3Code: "AIA"
	},
	{
		name: "Antarctica",
		alpha3Code: "ATA"
	},
	{
		name: "Antigua and Barbuda",
		alpha3Code: "ATG"
	},
	{
		name: "Argentina",
		alpha3Code: "ARG"
	},
	{
		name: "Armenia",
		alpha3Code: "ARM"
	},
	{
		name: "Aruba",
		alpha3Code: "ABW"
	},
	{
		name: "Australia",
		alpha3Code: "AUS"
	},
	{
		name: "Austria",
		alpha3Code: "AUT"
	},
	{
		name: "Azerbaijan",
		alpha3Code: "AZE"
	},
	{
		name: "Bahamas",
		alpha3Code: "BHS"
	},
	{
		name: "Bahrain",
		alpha3Code: "BHR"
	},
	{
		name: "Bangladesh",
		alpha3Code: "BGD"
	},
	{
		name: "Barbados",
		alpha3Code: "BRB"
	},
	{
		name: "Belarus",
		alpha3Code: "BLR"
	},
	{
		name: "Belgium",
		alpha3Code: "BEL"
	},
	{
		name: "Belize",
		alpha3Code: "BLZ"
	},
	{
		name: "Benin",
		alpha3Code: "BEN"
	},
	{
		name: "Bermuda",
		alpha3Code: "BMU"
	},
	{
		name: "Bhutan",
		alpha3Code: "BTN"
	},
	{
		name: "Bolivia (Plurinational State of)",
		alpha3Code: "BOL"
	},
	{
		name: "Bonaire, Sint Eustatius and Saba",
		alpha3Code: "BES"
	},
	{
		name: "Bosnia and Herzegovina",
		alpha3Code: "BIH"
	},
	{
		name: "Botswana",
		alpha3Code: "BWA"
	},
	{
		name: "Bouvet Island",
		alpha3Code: "BVT"
	},
	{
		name: "Brazil",
		alpha3Code: "BRA"
	},
	{
		name: "British Indian Ocean Territory",
		alpha3Code: "IOT"
	},
	{
		name: "United States Minor Outlying Islands",
		alpha3Code: "UMI"
	},
	{
		name: "Virgin Islands (British)",
		alpha3Code: "VGB"
	},
	{
		name: "Virgin Islands (U.S.)",
		alpha3Code: "VIR"
	},
	{
		name: "Brunei Darussalam",
		alpha3Code: "BRN"
	},
	{
		name: "Bulgaria",
		alpha3Code: "BGR"
	},
	{
		name: "Burkina Faso",
		alpha3Code: "BFA"
	},
	{
		name: "Burundi",
		alpha3Code: "BDI"
	},
	{
		name: "Cambodia",
		alpha3Code: "KHM"
	},
	{
		name: "Cameroon",
		alpha3Code: "CMR"
	},
	{
		name: "Canada",
		alpha3Code: "CAN"
	},
	{
		name: "Cabo Verde",
		alpha3Code: "CPV"
	},
	{
		name: "Cayman Islands",
		alpha3Code: "CYM"
	},
	{
		name: "Central African Republic",
		alpha3Code: "CAF"
	},
	{
		name: "Chad",
		alpha3Code: "TCD"
	},
	{
		name: "Chile",
		alpha3Code: "CHL"
	},
	{
		name: "China",
		alpha3Code: "CHN"
	},
	{
		name: "Christmas Island",
		alpha3Code: "CXR"
	},
	{
		name: "Cocos (Keeling) Islands",
		alpha3Code: "CCK"
	},
	{
		name: "Colombia",
		alpha3Code: "COL"
	},
	{
		name: "Comoros",
		alpha3Code: "COM"
	},
	{
		name: "Congo",
		alpha3Code: "COG"
	},
	{
		name: "Congo (Democratic Republic of the)",
		alpha3Code: "COD"
	},
	{
		name: "Cook Islands",
		alpha3Code: "COK"
	},
	{
		name: "Costa Rica",
		alpha3Code: "CRI"
	},
	{
		name: "Croatia",
		alpha3Code: "HRV"
	},
	{
		name: "Cuba",
		alpha3Code: "CUB"
	},
	{
		name: "Curaçao",
		alpha3Code: "CUW"
	},
	{
		name: "Cyprus",
		alpha3Code: "CYP"
	},
	{
		name: "Czech Republic",
		alpha3Code: "CZE"
	},
	{
		name: "Denmark",
		alpha3Code: "DNK"
	},
	{
		name: "Djibouti",
		alpha3Code: "DJI"
	},
	{
		name: "Dominica",
		alpha3Code: "DMA"
	},
	{
		name: "Dominican Republic",
		alpha3Code: "DOM"
	},
	{
		name: "Ecuador",
		alpha3Code: "ECU"
	},
	{
		name: "Egypt",
		alpha3Code: "EGY"
	},
	{
		name: "El Salvador",
		alpha3Code: "SLV"
	},
	{
		name: "Equatorial Guinea",
		alpha3Code: "GNQ"
	},
	{
		name: "Eritrea",
		alpha3Code: "ERI"
	},
	{
		name: "Estonia",
		alpha3Code: "EST"
	},
	{
		name: "Ethiopia",
		alpha3Code: "ETH"
	},
	{
		name: "Falkland Islands (Malvinas)",
		alpha3Code: "FLK"
	},
	{
		name: "Faroe Islands",
		alpha3Code: "FRO"
	},
	{
		name: "Fiji",
		alpha3Code: "FJI"
	},
	{
		name: "Finland",
		alpha3Code: "FIN"
	},
	{
		name: "France",
		alpha3Code: "FRA"
	},
	{
		name: "French Guiana",
		alpha3Code: "GUF"
	},
	{
		name: "French Polynesia",
		alpha3Code: "PYF"
	},
	{
		name: "French Southern Territories",
		alpha3Code: "ATF"
	},
	{
		name: "Gabon",
		alpha3Code: "GAB"
	},
	{
		name: "Gambia",
		alpha3Code: "GMB"
	},
	{
		name: "Georgia",
		alpha3Code: "GEO"
	},
	{
		name: "Germany",
		alpha3Code: "DEU"
	},
	{
		name: "Ghana",
		alpha3Code: "GHA"
	},
	{
		name: "Gibraltar",
		alpha3Code: "GIB"
	},
	{
		name: "Greece",
		alpha3Code: "GRC"
	},
	{
		name: "Greenland",
		alpha3Code: "GRL"
	},
	{
		name: "Grenada",
		alpha3Code: "GRD"
	},
	{
		name: "Guadeloupe",
		alpha3Code: "GLP"
	},
	{
		name: "Guam",
		alpha3Code: "GUM"
	},
	{
		name: "Guatemala",
		alpha3Code: "GTM"
	},
	{
		name: "Guernsey",
		alpha3Code: "GGY"
	},
	{
		name: "Guinea",
		alpha3Code: "GIN"
	},
	{
		name: "Guinea-Bissau",
		alpha3Code: "GNB"
	},
	{
		name: "Guyana",
		alpha3Code: "GUY"
	},
	{
		name: "Haiti",
		alpha3Code: "HTI"
	},
	{
		name: "Heard Island and McDonald Islands",
		alpha3Code: "HMD"
	},
	{
		name: "Vatican City",
		alpha3Code: "VAT"
	},
	{
		name: "Honduras",
		alpha3Code: "HND"
	},
	{
		name: "Hungary",
		alpha3Code: "HUN"
	},
	{
		name: "Hong Kong",
		alpha3Code: "HKG"
	},
	{
		name: "Iceland",
		alpha3Code: "ISL"
	},
	{
		name: "India",
		alpha3Code: "IND"
	},
	{
		name: "Indonesia",
		alpha3Code: "IDN"
	},
	{
		name: "Ivory Coast",
		alpha3Code: "CIV"
	},
	{
		name: "Iran (Islamic Republic of)",
		alpha3Code: "IRN"
	},
	{
		name: "Iraq",
		alpha3Code: "IRQ"
	},
	{
		name: "Ireland",
		alpha3Code: "IRL"
	},
	{
		name: "Isle of Man",
		alpha3Code: "IMN"
	},
	{
		name: "Israel",
		alpha3Code: "ISR"
	},
	{
		name: "Italy",
		alpha3Code: "ITA"
	},
	{
		name: "Jamaica",
		alpha3Code: "JAM"
	},
	{
		name: "Japan",
		alpha3Code: "JPN"
	},
	{
		name: "Jersey",
		alpha3Code: "JEY"
	},
	{
		name: "Jordan",
		alpha3Code: "JOR"
	},
	{
		name: "Kazakhstan",
		alpha3Code: "KAZ"
	},
	{
		name: "Kenya",
		alpha3Code: "KEN"
	},
	{
		name: "Kiribati",
		alpha3Code: "KIR"
	},
	{
		name: "Kuwait",
		alpha3Code: "KWT"
	},
	{
		name: "Kyrgyzstan",
		alpha3Code: "KGZ"
	},
	{
		name: "Lao People's Democratic Republic",
		alpha3Code: "LAO"
	},
	{
		name: "Latvia",
		alpha3Code: "LVA"
	},
	{
		name: "Lebanon",
		alpha3Code: "LBN"
	},
	{
		name: "Lesotho",
		alpha3Code: "LSO"
	},
	{
		name: "Liberia",
		alpha3Code: "LBR"
	},
	{
		name: "Libya",
		alpha3Code: "LBY"
	},
	{
		name: "Liechtenstein",
		alpha3Code: "LIE"
	},
	{
		name: "Lithuania",
		alpha3Code: "LTU"
	},
	{
		name: "Luxembourg",
		alpha3Code: "LUX"
	},
	{
		name: "Macao",
		alpha3Code: "MAC"
	},
	{
		name: "North Macedonia",
		alpha3Code: "MKD"
	},
	{
		name: "Madagascar",
		alpha3Code: "MDG"
	},
	{
		name: "Malawi",
		alpha3Code: "MWI"
	},
	{
		name: "Malaysia",
		alpha3Code: "MYS"
	},
	{
		name: "Maldives",
		alpha3Code: "MDV"
	},
	{
		name: "Mali",
		alpha3Code: "MLI"
	},
	{
		name: "Malta",
		alpha3Code: "MLT"
	},
	{
		name: "Marshall Islands",
		alpha3Code: "MHL"
	},
	{
		name: "Martinique",
		alpha3Code: "MTQ"
	},
	{
		name: "Mauritania",
		alpha3Code: "MRT"
	},
	{
		name: "Mauritius",
		alpha3Code: "MUS"
	},
	{
		name: "Mayotte",
		alpha3Code: "MYT"
	},
	{
		name: "Mexico",
		alpha3Code: "MEX"
	},
	{
		name: "Micronesia (Federated States of)",
		alpha3Code: "FSM"
	},
	{
		name: "Moldova (Republic of)",
		alpha3Code: "MDA"
	},
	{
		name: "Monaco",
		alpha3Code: "MCO"
	},
	{
		name: "Mongolia",
		alpha3Code: "MNG"
	},
	{
		name: "Montenegro",
		alpha3Code: "MNE"
	},
	{
		name: "Montserrat",
		alpha3Code: "MSR"
	},
	{
		name: "Morocco",
		alpha3Code: "MAR"
	},
	{
		name: "Mozambique",
		alpha3Code: "MOZ"
	},
	{
		name: "Myanmar",
		alpha3Code: "MMR"
	},
	{
		name: "Namibia",
		alpha3Code: "NAM"
	},
	{
		name: "Nauru",
		alpha3Code: "NRU"
	},
	{
		name: "Nepal",
		alpha3Code: "NPL"
	},
	{
		name: "Netherlands",
		alpha3Code: "NLD"
	},
	{
		name: "New Caledonia",
		alpha3Code: "NCL"
	},
	{
		name: "New Zealand",
		alpha3Code: "NZL"
	},
	{
		name: "Nicaragua",
		alpha3Code: "NIC"
	},
	{
		name: "Niger",
		alpha3Code: "NER"
	},
	{
		name: "Nigeria",
		alpha3Code: "NGA"
	},
	{
		name: "Niue",
		alpha3Code: "NIU"
	},
	{
		name: "Norfolk Island",
		alpha3Code: "NFK"
	},
	{
		name: "Korea (Democratic People's Republic of)",
		alpha3Code: "PRK"
	},
	{
		name: "Northern Mariana Islands",
		alpha3Code: "MNP"
	},
	{
		name: "Norway",
		alpha3Code: "NOR"
	},
	{
		name: "Oman",
		alpha3Code: "OMN"
	},
	{
		name: "Pakistan",
		alpha3Code: "PAK"
	},
	{
		name: "Palau",
		alpha3Code: "PLW"
	},
	{
		name: "Palestine, State of",
		alpha3Code: "PSE"
	},
	{
		name: "Panama",
		alpha3Code: "PAN"
	},
	{
		name: "Papua New Guinea",
		alpha3Code: "PNG"
	},
	{
		name: "Paraguay",
		alpha3Code: "PRY"
	},
	{
		name: "Peru",
		alpha3Code: "PER"
	},
	{
		name: "Philippines",
		alpha3Code: "PHL"
	},
	{
		name: "Pitcairn",
		alpha3Code: "PCN"
	},
	{
		name: "Poland",
		alpha3Code: "POL"
	},
	{
		name: "Portugal",
		alpha3Code: "PRT"
	},
	{
		name: "Puerto Rico",
		alpha3Code: "PRI"
	},
	{
		name: "Qatar",
		alpha3Code: "QAT"
	},
	{
		name: "Republic of Kosovo",
		alpha3Code: "UNK"
	},
	{
		name: "Réunion",
		alpha3Code: "REU"
	},
	{
		name: "Romania",
		alpha3Code: "ROU"
	},
	{
		name: "Russian Federation",
		alpha3Code: "RUS"
	},
	{
		name: "Rwanda",
		alpha3Code: "RWA"
	},
	{
		name: "Saint Barthélemy",
		alpha3Code: "BLM"
	},
	{
		name: "Saint Helena, Ascension and Tristan da Cunha",
		alpha3Code: "SHN"
	},
	{
		name: "Saint Kitts and Nevis",
		alpha3Code: "KNA"
	},
	{
		name: "Saint Lucia",
		alpha3Code: "LCA"
	},
	{
		name: "Saint Martin (French part)",
		alpha3Code: "MAF"
	},
	{
		name: "Saint Pierre and Miquelon",
		alpha3Code: "SPM"
	},
	{
		name: "Saint Vincent and the Grenadines",
		alpha3Code: "VCT"
	},
	{
		name: "Samoa",
		alpha3Code: "WSM"
	},
	{
		name: "San Marino",
		alpha3Code: "SMR"
	},
	{
		name: "Sao Tome and Principe",
		alpha3Code: "STP"
	},
	{
		name: "Saudi Arabia",
		alpha3Code: "SAU"
	},
	{
		name: "Singapore",
		alpha3Code: "SGP"
	},
	{
		name: "Senegal",
		alpha3Code: "SEN"
	},
	{
		name: "Serbia",
		alpha3Code: "SRB"
	},
	{
		name: "Seychelles",
		alpha3Code: "SYC"
	},
	{
		name: "Sierra Leone",
		alpha3Code: "SLE"
	},
	{
		name: "Sint Maarten (Dutch part)",
		alpha3Code: "SXM"
	},
	{
		name: "Slovakia",
		alpha3Code: "SVK"
	},
	{
		name: "Slovenia",
		alpha3Code: "SVN"
	},
	{
		name: "Solomon Islands",
		alpha3Code: "SLB"
	},
	{
		name: "Somalia",
		alpha3Code: "SOM"
	},
	{
		name: "South Africa",
		alpha3Code: "ZAF"
	},
	{
		name: "South Georgia and the South Sandwich Islands",
		alpha3Code: "SGS"
	},
	{
		name: "Korea (Republic of)",
		alpha3Code: "KOR"
	},
	{
		name: "Spain",
		alpha3Code: "ESP"
	},
	{
		name: "Sri Lanka",
		alpha3Code: "LKA"
	},
	{
		name: "Sudan",
		alpha3Code: "SDN"
	},
	{
		name: "South Sudan",
		alpha3Code: "SSD"
	},
	{
		name: "Suriname",
		alpha3Code: "SUR"
	},
	{
		name: "Svalbard and Jan Mayen",
		alpha3Code: "SJM"
	},
	{
		name: "Swaziland",
		alpha3Code: "SWZ"
	},
	{
		name: "Sweden",
		alpha3Code: "SWE"
	},
	{
		name: "Switzerland",
		alpha3Code: "CHE"
	},
	{
		name: "Syrian Arab Republic",
		alpha3Code: "SYR"
	},
	{
		name: "Taiwan",
		alpha3Code: "TWN"
	},
	{
		name: "Tajikistan",
		alpha3Code: "TJK"
	},
	{
		name: "Tanzania, United Republic of",
		alpha3Code: "TZA"
	},
	{
		name: "Thailand",
		alpha3Code: "THA"
	},
	{
		name: "Timor-Leste",
		alpha3Code: "TLS"
	},
	{
		name: "Togo",
		alpha3Code: "TGO"
	},
	{
		name: "Tokelau",
		alpha3Code: "TKL"
	},
	{
		name: "Tonga",
		alpha3Code: "TON"
	},
	{
		name: "Trinidad and Tobago",
		alpha3Code: "TTO"
	},
	{
		name: "Tunisia",
		alpha3Code: "TUN"
	},
	{
		name: "Turkey",
		alpha3Code: "TUR"
	},
	{
		name: "Turkmenistan",
		alpha3Code: "TKM"
	},
	{
		name: "Turks and Caicos Islands",
		alpha3Code: "TCA"
	},
	{
		name: "Tuvalu",
		alpha3Code: "TUV"
	},
	{
		name: "Uganda",
		alpha3Code: "UGA"
	},
	{
		name: "Ukraine",
		alpha3Code: "UKR"
	},
	{
		name: "United Arab Emirates",
		alpha3Code: "ARE"
	},
	{
		name: "United Kingdom of Great Britain and Northern Ireland",
		alpha3Code: "GBR"
	},
	{
		name: "United States of America",
		alpha3Code: "USA"
	},
	{
		name: "Uruguay",
		alpha3Code: "URY"
	},
	{
		name: "Uzbekistan",
		alpha3Code: "UZB"
	},
	{
		name: "Vanuatu",
		alpha3Code: "VUT"
	},
	{
		name: "Venezuela (Bolivarian Republic of)",
		alpha3Code: "VEN"
	},
	{
		name: "Vietnam",
		alpha3Code: "VNM"
	},
	{
		name: "Wallis and Futuna",
		alpha3Code: "WLF"
	},
	{
		name: "Western Sahara",
		alpha3Code: "ESH"
	},
	{
		name: "Yemen",
		alpha3Code: "YEM"
	},
	{
		name: "Zambia",
		alpha3Code: "ZMB"
	},
	{
		name: "Zimbabwe",
		alpha3Code: "ZWE"
	}
].map((c) => [c.alpha3Code, c.name]));
// src/core/mapCountryResponse.ts
function mapCountryResponse(raw) {
	return {
		code: raw.alpha3Code,
		name: raw.name,
		flagUrl: raw.flags.svg,
		capital: raw.capital ?? null,
		region: raw.region,
		population: raw.population,
		description: `${raw.name} is a country in ${raw.subregion ?? raw.region}.`,
		area: raw.area ?? null,
		borderCodes: raw.borders ?? [],
		languages: (raw.languages ?? []).map((lang) => lang.name),
		currencies: raw.currencies ?? [],
		borderNames: (raw.borders ?? []).map((code) => COUNTRY_NAMES.get(code) ?? code)
	};
}
// src/UI/element-creators.ts
function createElement$6(tag, options = {}) {
	const { className, text, attrs, parent } = options;
	const el = document.createElement(tag);
	if (className) el.className = className;
	if (text !== void 0) el.textContent = String(text);
	if (attrs) Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
	if (parent) parent.append(el);
	return el;
}
function createButton$5(text, className, parent) {
	return createElement$6("button", {
		className,
		text,
		attrs: { type: "button" },
		parent
	});
}
function appendEach$2(parent, items, create) {
	const elements = items.map(create);
	parent.append(...elements);
}
function createLink(href, className, parent, text) {
	return createElement$6("a", {
		className,
		text,
		attrs: {
			href,
			target: "_blank",
			rel: "noopener noreferrer"
		},
		parent
	});
}
function createDialog(block, title, parent) {
	const dialog = createElement$6("dialog", {
		className: block,
		parent
	});
	const content = createElement$6("div", {
		className: `${block}__content`,
		parent: dialog
	});
	createElement$6("h2", {
		className: `${block}__title`,
		text: title,
		parent: content
	});
	return {
		dialog,
		content
	};
}
function createFieldset(block, legend, parent) {
	const fieldset = createElement$6("fieldset", {
		className: `${block}__section`,
		parent
	});
	createElement$6("legend", {
		className: `${block}__section-title`,
		text: legend,
		parent: fieldset
	});
	return fieldset;
}
function createTableRow(values, cellTag, cellClass, parent) {
	const row = createElement$6("tr", { parent });
	values.forEach((value) => createElement$6(cellTag, {
		className: cellClass,
		text: value,
		parent: row
	}));
	return row;
}
var elementCreators = {
	createElement: createElement$6,
	createButton: createButton$5,
	appendEach: appendEach$2,
	createLink,
	createDialog,
	createFieldset,
	createTableRow
};
// src/UI/details-modal.ts
var { createElement: createElement$5, createButton: createButton$4 } = elementCreators;
var image;
var title;
var description;
var area;
var borders;
var languages;
var currencies;
function createDetailsModal() {
	const dialog = createElement$5("dialog", {
		className: "details-dialog",
		parent: document.body
	});
	const details = createElement$5("div", {
		className: "details",
		parent: dialog
	});
	const closeButton = createButton$4("✕", "details__close", details);
	closeButton.setAttribute("aria-label", "Close");
	closeButton.addEventListener("click", () => dialog.close());
	image = createElement$5("img", {
		className: "details__image",
		parent: createElement$5("div", {
			className: "details__media",
			parent: details
		})
	});
	const info = createElement$5("div", {
		className: "details__info",
		parent: details
	});
	title = createElement$5("h2", {
		className: "details__title",
		parent: createElement$5("div", {
			className: "details__header",
			parent: info
		})
	});
	createElement$5("h3", {
		className: "details__subtitle",
		text: "Description:",
		parent: info
	});
	description = createElement$5("p", {
		className: "details__description",
		parent: info
	});
	const stats = createElement$5("dl", {
		className: "details__stats",
		parent: info
	});
	area = createStat$1("Area:", stats);
	borders = createStat$1("Borders:", stats);
	languages = createStat$1("Languages:", stats);
	currencies = createStat$1("Currency:", stats);
	return dialog;
}
function initDetailsModal(dialog, country) {
	image.src = country.flagUrl;
	image.alt = `Flag of ${country.name}`;
	title.textContent = country.name;
	description.textContent = country.description;
	area.textContent = country.area === null ? "—" : `${country.area.toLocaleString("en-US")} km²`;
	borders.textContent = joinOrDash(country.borderNames);
	languages.textContent = joinOrDash(country.languages);
	currencies.textContent = joinOrDash(country.currencies.map((c) => `${c.name} (${c.symbol}, ${c.code})`));
	dialog.showModal();
}
function createStat$1(label, parent) {
	const stat = createElement$5("div", {
		className: "details__stat",
		parent
	});
	createElement$5("dt", {
		className: "details__label",
		text: label,
		parent: stat
	});
	return createElement$5("dd", {
		className: "details__value",
		parent: stat
	});
}
function joinOrDash(items) {
	return items.length > 0 ? items.join(", ") : "—";
}
// src/UI/header.ts
var { createElement: createElement$4, createButton: createButton$3 } = elementCreators;
var input;
function createHeader(callbacks) {
	const header = createElement$4("header", {
		className: "header",
		parent: document.body
	});
	const search = createElement$4("div", {
		className: "header__search",
		parent: createElement$4("div", {
			className: "header__upper",
			parent: header
		})
	});
	input = createElement$4("input", {
		className: "header__input",
		attrs: {
			type: "text",
			placeholder: "Type a country name",
			"aria-label": "Country name"
		},
		parent: search
	});
	const clearButton = createButton$3("Clear", "header__button", search);
	input.addEventListener("input", () => callbacks.onChange(input.value.trim()));
	clearButton.addEventListener("click", () => {
		input.value = "";
		input.focus();
		callbacks.onChange("");
	});
	return header;
}
function setHeaderInput(value) {
	input.value = value;
}
// src/UI/history.ts
var { createElement: createElement$3, createButton: createButton$2, appendEach: appendEach$1 } = elementCreators;
var list;
var historyCb$1;
function createHistory(parent, callbacks) {
	historyCb$1 = callbacks;
	const history = createElement$3("aside", {
		className: "history",
		parent
	});
	createElement$3("h2", {
		className: "history__title",
		text: "History",
		parent: history
	});
	list = createElement$3("ul", {
		className: "history__list",
		parent: history
	});
	return history;
}
function updateHistoryList(state) {
	list.replaceChildren();
	appendEach$1(list, [...state.searchHistory].reverse(), createHistoryItem);
}
function createHistoryItem(query) {
	const item = createElement$3("li");
	createButton$2(query, "history__item", item).addEventListener("click", () => historyCb$1.onHistoryClick(query));
	return item;
}
// src/UI/country-card.ts
var { createElement: createElement$2, createButton: createButton$1 } = elementCreators;
function createCountryCard(country, onOpen) {
	const card = createElement$2("div", { className: "search-item" });
	const media = createElement$2("div", {
		className: "search-item__media",
		parent: card
	});
	createElement$2("img", {
		className: "search-item__image",
		attrs: {
			src: country.flagUrl,
			alt: `Flag of ${country.name}`
		},
		parent: media
	});
	const stats = createElement$2("div", {
		className: "search-item__stats",
		parent: card
	});
	createStat("Capital:", country.capital ?? "—", stats);
	createStat("Region:", country.region, stats);
	createStat("Population:", country.population.toLocaleString("en-US"), stats);
	createElement$2("h3", {
		className: "search-item__title",
		text: country.name,
		parent: card
	});
	createButton$1("more...", "search-item__button", card);
	card.addEventListener("click", () => onOpen(country.code));
	return card;
}
function createStat(label, value, parent) {
	const stat = createElement$2("span", {
		className: "search-item__stat",
		parent
	});
	createElement$2("span", {
		className: "search-item__label",
		text: label,
		parent: stat
	});
	stat.append(value);
}
// src/UI/results.ts
var { createElement: createElement$1, createButton, appendEach } = elementCreators;
var resultsCb$1;
var loading;
var empty;
var error;
var errorText;
var grid;
function createResults(parent, callbacks) {
	resultsCb$1 = callbacks;
	const results = createElement$1("main", {
		className: "results",
		parent
	});
	loading = createElement$1("div", {
		className: "status",
		parent: results
	});
	createElement$1("div", {
		className: "status__spinner",
		attrs: {
			role: "status",
			"aria-label": "Loading"
		},
		parent: loading
	});
	createElement$1("span", {
		text: "Loading...",
		parent: loading
	});
	empty = createElement$1("div", {
		className: "status",
		parent: results
	});
	createElement$1("span", {
		text: "Nothing found. Try another name.",
		parent: empty
	});
	error = createElement$1("div", {
		className: "status status--error",
		parent: results
	});
	errorText = createElement$1("span", { parent: error });
	createButton("Retry", "header__button", error).addEventListener("click", () => resultsCb$1.onRetry());
	grid = createElement$1("div", {
		className: "card-grid",
		parent: results
	});
	return results;
}
function updateResults(state) {
	loading.hidden = state.status !== "loading";
	empty.hidden = state.status !== "empty";
	error.hidden = state.status !== "error";
	grid.hidden = state.status !== "results";
	errorText.textContent = state.errorMessage;
	grid.replaceChildren();
	appendEach(grid, state.countries, (country) => createCountryCard(country, resultsCb$1.onOpenDetails));
}
// src/view.ts
var { createElement } = elementCreators;
var detailsModal;
function createViews(callbacks) {
	createHeader(callbacks.headerCb);
	const page = createElement("div", {
		className: "page",
		parent: document.body
	});
	createHistory(page, callbacks.historyCb);
	createResults(page, callbacks.resultsCb);
	detailsModal = createDetailsModal();
}
function updateViews(state) {
	updateHistoryList(state);
	updateResults(state);
}
function openInitDetailsModal(country) {
	initDetailsModal(detailsModal, country);
}
function setSearchInput(value) {
	setHeaderInput(value);
}
// src/controller.ts
var stateCb;
var viewCb;
var headerCb;
var historyCb;
var resultsCb;
function main() {
	stateCb = { onChangeDetected };
	headerCb = { onChange };
	historyCb = { onHistoryClick };
	resultsCb = {
		onRetry: () => onRetry(state.currentQuery),
		onOpenDetails
	};
	viewCb = {
		headerCb,
		historyCb,
		resultsCb
	};
	initState(stateCb);
	createViews(viewCb);
	updateViews(state);
}
function onChangeDetected() {
	updateViews(state);
}
async function search(query) {
	setState({
		currentQuery: query,
		errorMessage: "",
		status: "loading"
	});
	const { countries, errorMessage } = await fetchWrapper(query);
	if (countries) {
		updateHistory(query);
		setState({
			countries: countries.map(mapCountryResponse),
			status: countries.length > 0 ? "results" : "empty"
		});
	} else if (errorMessage) setState({
		errorMessage,
		countries: [],
		status: "error"
	});
}
var debounceHandler = debounce(search, 400);
var onChange = (input) => {
	if (input !== state.currentQuery) toAbort();
	if (input === "") handleEmptyInput();
	else debounceHandler(input);
};
var onRetry = (input) => {
	debounceHandler.cancel();
	search(input);
};
function handleEmptyInput() {
	debounceHandler.cancel();
	setState({
		countries: [],
		status: "idle"
	});
}
function onHistoryClick(query) {
	setSearchInput(query);
	onRetry(query);
}
function onOpenDetails(code) {
	const country = state.countries.find((c) => c.code === code);
	if (country) openInitDetailsModal(country);
}
// src/index.ts
main();

//# sourceMappingURL=main-yPzrtiKJ.js.map