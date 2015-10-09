/**
    // import {betRegExp, resultRegExp, products, settleBets} from './bettingHost';
    
    Note: To avoid extra dependencies dowloading, I skipped the ECMAScript 6 transpiling
    modules which allow us to export and import within javascript files.
    Instead I just copy the javascript code that is being tested into this test file so the 
    tests can pick it up.
**/

var betRegExp    = /^Bet:([W|P|E]):(\d+(?:,\d+)?):(\d+)$/,
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
    
    console.log(winningPlace);
    
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

/* Actual tests code */
describe('betting host tests', function() {
    
    it('regular expression test', function() {
        expect(!!"Bet:W:1:5".match(betRegExp)).toEqual(true);
        expect(!!"Bet:E:3:25".match(betRegExp)).toEqual(true);
        expect(!!"Result:1:3:5".match(betRegExp)).toEqual(false);
        
        expect(!!"Result:1:3:5".match(resultRegExp)).toEqual(true);
        expect(!!"Result:1:5".match(resultRegExp)).toEqual(false);
    });
    
    it('product winner test', function() {
        expect(products.W.winners(['1', '2', '3'])).toEqual(['1']);
        expect(products.P.winners(['1', '2', '3'])).toEqual(['1', '2', '3']);
        expect(products.E.winners(['1', '2', '3'])).toEqual(['1,2']);
    });
    
    it('produc settle logic test', function() {
        expect(products.W.settle(['1', '2', '3'], '1')).toEqual(true);
        expect(products.W.settle(['1', '2', '3'], '2')).toEqual(false);
        expect(products.P.settle(['1', '2', '3'], '2')).toEqual(true);
        expect(products.E.settle(['1', '2', '3'], '1,2')).toEqual(true);
        expect(products.E.settle(['1', '2', '3'], '2,1')).toEqual(false);
    });
    
    it('settlement test', function() {
        var bets = [
            {product: 'W', selection: '1', stake: 20},
            {product: 'W', selection: '2', stake: 30},
            {product: 'W', selection: '3', stake: 50},
            {product: 'P', selection: '3', stake: 20},
            {product: 'P', selection: '4', stake: 30},
            {product: 'P', selection: '1', stake: 10},
            {product: 'E', selection: '1,2', stake: 10},
            {product: 'E', selection: '3,4', stake: 100}
        ], results = ['1', '2', '3'];
        
        expect(settleBets(bets, results)).toEqual({
            'W': {'1': 4.25},
            'P': {
                '1': 1.76,
                '3': 0.88
            },
            'E': {'1,2': 9.02}
        });
    });
});
