var sys          = require("sys"),
    stdin        = process.openStdin(),
    bets         = [],
    results      = [],
    betRegExp    = /^Bet:([W|P|E]):(\d+(?:,\d+)?):(\d+)$/,
    resultRegExp = /^Result:(\d+):(\d+):(\d+)$/,
    products     = {
        W: {
            name: 'Win',
            profit: 0.15,
            get winners() { return function (results) { return [(results || [])[0]]; }},
            get settle()  { return function (results, selection) {
                return (results || [])[0] === selection;
            }}
        },
        P: {
            name: 'Place',
            profit: 0.12,
            get winners() { return function (results) { return results; }},
            get settle()  { return function (results, selection) {
                return (results || []).indexOf(selection) !== -1;
            }}
        }, 
        E: {
            name: 'Exacta',
            profit: 0.18,
            get winners() { return function (results) { return [results[0] + "," + results[1]]; }},
            get settle()  { return function (results, selection) {
                return results[0] + "," + results[1] === selection;
            }}
        }
};

var settleBets = function(bets, results) {
    
    // pool object {product1: stake, product2: stake}
    var pool = bets.reduce(function(poolStats, bet) {
        if (!poolStats[bet.product]) { poolStats[bet.product] = 0; }
        poolStats[bet.product] += parseInt(bet.stake);
        return poolStats;
    }, {});
    
    // winning object {product1: winningStake, product2: winningStake}    
    var winning = bets.reduce(function(winningStats, bet) {
        if (!winningStats[bet.product]) { winningStats[bet.product] = 0; }
        winningStats[bet.product] += 
            products[bet.product].settle(results, bet.selection) ? parseInt(bet.stake) : 0;
        return winningStats;
    }, {});
    
    // place winning object {seletion1: stake, selection2: stake}
    var winningPlace = bets.filter(function(bet) {
        return bet.product === 'P';
    }).reduce(function(placeStats, bet) {
        if (!placeStats[bet.selection]) { placeStats[bet.selection] = 0; }
        placeStats[bet.selection] += 
            products[bet.product].settle(results, bet.selection) ? parseInt(bet.stake) : 0;
        return placeStats;
    }, {});
    
    var dividends = {};
    Object.keys(pool).forEach(function(product) {
        products[product].winners(results).forEach(function(winner) {
            if (!dividends[product]) { dividends[product] = {}; }
            // calculate place winning dividends by splitting the pool into 3
            if (product === 'P' && !!winningPlace[winner] && winningPlace[winner] > 0) {
                dividends[product][winner] = 
                    (pool[product] * (1 - products[product].profit)) / (3 * winningPlace[winner]);
            } else if (product !== 'P') {
                dividends[product][winner] = 
                    (pool[product] * (1 - products[product].profit)) / winning[product];
            }
        });
    });
    
    return dividends;
};

var outputDividends = function(dividends) {
    console.log("\nDividends\n-------------");
    Object.keys(dividends).forEach(function(product) {
        Object.keys(dividends[product]).sort(function(a, b) {
            // sort place runners to be the results order
            return results.indexOf(a) < results.indexOf(b) ? -1 : 1;  
        }).forEach(function(winner) {
            console.log(products[product].name + ":" + winner +
                    ":$" + dividends[product][winner].toFixed(2));
        }); 
    });
};

stdin.addListener("data", function(d) {
    var input = d.toString().trim(),
        bet = input.match(betRegExp),
        result = input.match(resultRegExp);
    
    if (!bet && !result) { console.log("Invalid Input!\n"); }
    
    if (!!bet) {
        bets.push({
            product: bet[1],
            selection: bet[2],
            stake: bet[3]
        });
    }
    
    if (!!result) {
        results = result.splice(1, 3);
        outputDividends(settleBets(bets, results));
        process.stdin.unref(); // terminate stdin process
    }
});