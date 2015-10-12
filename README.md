# Betting Host Readme

* IMPORTANT NOTE: BettingHost is a miniature NodeJS project which REQUIRES NodeJS to be installed in your system.

# Prerequisite / Dependencies

 * Node.js

To download: 
 
 * MacOS X
 https://nodejs.org/dist/v4.1.2/node-v4.1.2.pkg

 * Windows:
 https://nodejs.org/dist/v4.1.2/win-x86/node.exe  (32 bit)
 https://nodejs.org/dist/v4.1.2/win-x64/node.exe  (64 bit)

* Linux:
 ```sudo apt-get install --yes nodejs```


# Run Script

 * In your console cd to betting host project foler, run command ```npm start``` or ```node bettingHost.js```

 * Paste bets & results test in the correct format, e.g.

```sh
Bet:W:1:20                                     
Bet:W:2:30
Bet:W:3:50
Bet:P:3:20
Bet:P:4:30
Bet:P:1:10
Bet:E:1,2:10
Bet:E:3,4:100
Result:1:2:3
```

* press enter, output is something like

```sh
Dividends
-------------
Win:1:$4.25
Place:1:$1.76
Place:3:$0.88
Exacta:1,2:$9.02
```

# Run Unit Tests

 * Karma test runner is required to run the unit tests.

 * To install karma and other server side dependencies,  run command ```npm install```  in console within this app folder where 'package.json' sits.

 * After ```npm install``` finishes,  run  ```npm test```  to execute tests, you should be able to see a Chrome browser window pops up and in console stdout you should see the tests results.








