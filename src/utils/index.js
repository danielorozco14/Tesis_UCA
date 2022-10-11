function isEven(n) {
    return Math.abs(n % 2) != 1;
}

function getRootCode(pfastetter) {

    let array = pfastetter.split("");

    while (!isEven(array[array.length - 1])) {
        array.pop();
    }

    return array.join("");
}

export const createSqlQuery = (array) => {

    let query = "", rootCode = getRootCode(array[0]);

    if (isEven(array[0][array.length - 1])) {
        query += `Pfastetter = '${array[0]}'`;
    } else {
        query += `(Pfastetter >= '${array[0]}' AND Pfastetter LIKE '${rootCode}%') OR Pfastetter LIKE '${rootCode}0%'`;
    }

    for (let i = 1; i < array.length; i++) {
        rootCode = getRootCode(array[i])
        if (isEven(array[0][array.length - 1])) {
            query += ` or Pfastetter = '${array[i]}'`;
        } else {
            query += ` or (Pfastetter >= '${array[i]}' AND Pfastetter LIKE '${rootCode}%') OR Pfastetter LIKE '${rootCode}0%'`;
        }
    }

    /*let rootCode = getRootCode(array);

    if (isEven(array[array.length - 1])) {
        return `Pfastetter = '${array}'`
    }

    let query = `(Pfastetter >= '${array}' AND Pfastetter LIKE '${rootCode}%') OR Pfastetter LIKE '${rootCode}0%'`;*/

    return query;
}

export const getLastYearInfo = (features) => {
    features.sort(function (feature1, feature2) {

        return feature1.attributes.dga - feature2.attributes.dga;
    })

    var aux = features[0];
    const filteredFeatures = [];

    features.forEach((e, index) => {

        if (e.attributes.anio > aux.attributes.anio) {
            aux = e;
        }

        if (!features[index + 1] || e.attributes.dga != features[index + 1].attributes.dga) {

            filteredFeatures.push(aux);
            aux = features[index + 1];
        }

    }, this);

    features = filteredFeatures;

    return features;

}

export const getMostVolumeInfo = (features) => {
    features.sort(function (feature1, feature2) {

        return feature1.attributes.dga - feature2.attributes.dga;
    })

    var aux = features[0];
    const filteredFeatures = [];

    features.forEach((e, index) => {

        if (e.attributes.consumo_anual_m3 > aux.attributes.consumo_anual_m3) {
            aux = e;
        }

        if (!features[index + 1] || e.attributes.dga != features[index + 1].attributes.dga) {

            filteredFeatures.push(aux);
            aux = features[index + 1];
        }

    }, this);

    features = filteredFeatures;

    return features;

}

export const tableFormatting = (results) => {

    return results.map((feature) => {
        return {
            ...feature.attributes,
            consumo_anual_m3: Math.round(feature.attributes.consumo_anual_m3),
        }
    });
}
