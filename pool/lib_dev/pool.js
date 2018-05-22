var fs = require('fs');
var net = require('net');
var crypto = require('crypto');
// Options for development
// 
	var debug = true
    var debugWrite =false
	if (debug) console.log('A Minty pool Request : %s ','Love Ya all')    
var async = require('async');
var bignum = require('bignum');
var multiHashing = require('multi-hashing');
var cnUtil = require('cryptonote-util');

// Must exactly be 8 hex chars
var noncePattern = new RegExp("^[0-9A-Fa-f]{8}$");

var threadId = '(Thread ' + process.env.forkId + ') ';

var logSystem = 'pool';
require('./exceptionWriter.js')(logSystem);

var apiInterfaces = require('./apiInterfaces.js')(config.daemon, config.wallet);
var utils = require('./utils.js');

var log = function(severity, system, text, data){
    global.log(severity, system, threadId + text, data);
};

var cryptoNight = multiHashing['cryptonight'];

function cryptoNightFast(buf) {
    return cryptoNight(Buffer.concat([new Buffer([buf.length]), buf]), true);
}

var diff1 = bignum('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 16);

var instanceId = crypto.randomBytes(4);

var validBlockTemplates = [];
var currentBlockTemplate;

//Vars for slush mining
var scoreTime;
var lastChecked = 0;

var connectedMiners = {};

var bannedIPs = {};
var perIPStats = {};

var shareTrustEnabled = config.poolServer.shareTrust && config.poolServer.shareTrust.enabled;
var shareTrustStepFloat = shareTrustEnabled ? config.poolServer.shareTrust.stepDown / 100 : 0;
var shareTrustMinFloat = shareTrustEnabled ? config.poolServer.shareTrust.min / 100 : 0;


var banningEnabled = config.poolServer.banning && config.poolServer.banning.enabled;


setInterval(function(){
    var now = Date.now() / 1000 | 0;
    for (var minerId in connectedMiners){
        var miner = connectedMiners[minerId];
        miner.retarget(now);
    }
}, config.poolServer.varDiff.retargetTime * 1000);


/* Every 30 seconds clear out timed-out miners and old bans */
setInterval(function(){
    var now = Date.now();
    var timeout = config.poolServer.minerTimeout * 1000;
    for (var minerId in connectedMiners){
        var miner = connectedMiners[minerId];
        if (now - miner.lastBeat > timeout){
            log('warn', logSystem, 'Miner timed out and disconnected %s@%s', [miner.login, miner.ip]);
            delete connectedMiners[minerId];
        }
    }

    if (banningEnabled){
        for (ip in bannedIPs){
            var banTime = bannedIPs[ip];
            if (now - banTime > config.poolServer.banning.time * 1000) {
                delete bannedIPs[ip];
                delete perIPStats[ip];
                log('info', logSystem, 'Ban dropped for %s', [ip]);
            }
        }
    }

}, 30000);


process.on('message', function(message) {
    switch (message.type) {
        case 'banIP':
            bannedIPs[message.ip] = Date.now();
            break;
    }
});


function IsBannedIp(ip){
    if (!banningEnabled || !bannedIPs[ip]) return false;

    var bannedTime = bannedIPs[ip];
    var bannedTimeAgo = Date.now() - bannedTime;
    var timeLeft = config.poolServer.banning.time * 1000 - bannedTimeAgo;
    if (timeLeft > 0){
        return true;
    }
    else {
        delete bannedIPs[ip];
        log('info', logSystem, 'Ban dropped for %s', [ip]);
        return false;
    }
}


function BlockTemplate(template){
    this.blob = template.blocktemplate_blob;
    this.difficulty = template.difficulty;
    this.height = template.height;
    this.reserveOffset = template.reserved_offset;
//disabeld for MINT
//    this.buffer = new Buffer(this.blob, 'hex');
//    instanceId.copy(this.buffer, this.reserveOffset + 4, 0, 3);
    this.extraNonce = 0;
}
BlockTemplate.prototype = {
    nextBlob: function(){
        this.buffer.writeUInt32BE(++this.extraNonce, this.reserveOffset);
        return cnUtil.convert_blob(this.buffer).toString('hex');
    }
};



function getBlockTemplate(callback){
	console.log("pool: getblocktemplate") 
    apiInterfaces.rpcDaemon('getblocktemplate', {reserve_size: 8, wallet_address: config.poolServer.poolAddress}, callback);
	console.log(callback.result)
}

function getPeerInfo(callback){
	callback = callback || function(){};
	console.log("pool: getpeerinfo") 
    	apiInterfaces.rpcDaemon('getpeerinfo', {}, callback);
	
	console.log(JSON.stringify(callback))
}


function jobRefresh(loop, callback){
    callback = callback || function(){};

    	//NEXT FUBFTION
    	getPeerInfo(function(error, result){
        //console.log(JSON.stringify(result));
        log('info', logSystem, 'New Peers found');
        
        	if (error){
        	log('error', logSystem, 'Error polling GETPEERINFO %j', [error]);
    	    //callback(false);
	        //return;	        
        	}
        	console.log(' this is what you are looking for ' + Object.keys(result).length)
        	//
        	//  get total number of peers
        	// 
        	redisClient.hgetall(config.coin + ':peer:active', function(err, results) {
   				if (err) {
        		console.log(" An error" + err);
       			// do something like callback(err) or whatever
       			}
            	// do something with the result
            	var peerstotal = 0;
            	console.log(' Total number of peers' + Object.keys(results).length);
            	peerstotal =  Object.keys(results).length;
				redisClient.hset(config.coin + ':stats','peerstotal', peerstotal);
            	
            });
            
        	
        	//var peerslive=
 //       	redisClient.hset(config.coin + ':stats:height', result.height)
	     	redisClient.hset(config.coin + ':stats','peerslive',  Object.keys(result).length)

       		redisClient.hset(config.coin + ':stats','peerslastupdate', Date.now()/1000)
        	for (counter in result){
            	var Peer = result[counter];
            	//console.log('result: %s ', JSON.stringify(Peer))
				//console.log(counter)
            	//console.log(result[counter])
            	processPeerInfoFromMINT(Peer,function(error,result){
                if (error){
        			log('error', logSystem, 'Error polling GETPEERINFO %j', [error]);
               	} 
                // do something with results
                // 
                });
            }
        	
        	//processPeerInfoMINT(result);
        
        })
                     

    getBlockTemplate(function(error, result){
	console.log("pool: jobrefresh")    
//	console.log(result) 
//	console.log(error)    
    
        if (loop)
            setTimeout(function(){
                jobRefresh(true);
            }, config.poolServer.blockRefreshInterval);
        if (error){
            log('error', logSystem, 'Error polling getblocktemplate %j', [error]);
        	// do something like callback(err) or whatever
            callback(false);
            return;
        }
    
    
        if (!currentBlockTemplate || result.height > currentBlockTemplate.height){
            log('info', logSystem, 'New block to mine at height %d w/ difficulty of %d', [result.height, result.difficulty]);
        	redisClient.hset(config.coin + ':stats','height', result.height)
            redisClient.hset(config.coin + ':stats','curtime', result.curtime)
			redisClient.hset(config.coin + ':stats','difficulty', result.difficulty)
//redisCommands.push(['hset', config.coin + ':stats', 'height', 0]);
//redisCommands.push(['hset', config.coin + ':stats', 'curtime', 0]);                            
        	//redisCommands.push(['hset', config.coin + ':stats:lastblock', 'height', result.height]);
        	//redisCommands.push(['hset', config.coin + ':stats:lastblock', 'curtime', result.curtime]);
        	//redisCommands.push(['hset', config.coin + ':stats', 'lastUpdate', Date.now()]);
            processBlockTemplateMINT(result);

        }
    	

        callback(true);
    })
}

function processPeerInfoFromMINT(Peer){
 	//console.log(JSON.stringify( 'processPeerInfoFromMINT') + " " + JSON.stringify(Peer));

	redisClient.hget(config.coin + ':peer:active',Peer.addr, function(err, results) {
   		if (err) {
        console.log(" An error" + err);
       	// do something like callback(err) or whatever
       	}
      	// do something with results
      	//console.log(" " + results );
    	if (results==null){
        		console.log('results is null')
        		var onlinescore=0;
              	redisClient.hset(config.coin + ':peer:active',Peer.addr,[
				Peer.addr,
				Peer.services,
                Peer.lastsend,
                Peer.lastrecv,
                Peer.conntime,
                Peer.version,
                Peer.subver,
                Peer.inbound,
                Peer.releasetime,
                Peer.startingheight,
                Peer.banscore,
                onlinescore,
            	'a',
                Date.now(),
                ].join('@:@'));  
        
        }
    	
    	if (results != null){
        	var result = results.split('@:@');
 //       	console.log("   " + result[0]);
        	if (result[0]==Peer.addr){
            	onlinescore = parseInt(result[11])+1;
            	//onlinescore.toInteger()
            	redisClient.hset(config.coin + ':peer:active',Peer.addr,[
				Peer.addr,
				Peer.services,
                Peer.lastsend,
                Peer.lastrecv,
                Peer.conntime,
                Peer.version,
                Peer.subver,
                Peer.inbound,
                Peer.releasetime,
                Peer.startingheight,
                Peer.banscore,
                onlinescore,
            	'u',
                

                ].join('@:@')); 
            
            
            }
        }

		});

}

function processPeerInfoMINT(Peer, callback){
//        		var onlinescore=0;
        		var onlinescore=0;

                   		

	callback(false);


}



function processBlockTemplateMINT(template){
	console.log(template) 
	redisClient.zadd(config.coin + ':blocks:candidates',template.height,  [
                template.bits,
                template.curtime,
                template.difficulty,
     			template.previousblockhash,
            ].join(':'))
//example template
//{ version: 4,
//  previousblockhash: '8c0c951808fe69dad95920677f14dff8491a202a1906cb33efa27f002e784751',
//  transactions: [],
//  coinbaseaux: { flags: '062f503253482f' },
//  coinbasevalue: 1000000,
//  target: '0000000e6cf30000000000000000000000000000000000000000000000000000',
//  mintime: 1526726439,
//  mutable: [ 'time', 'transactions', 'prevblock' ],
//  noncerange: '00000000ffffffff',
//  sigoplimit: 20000,
//  sizelimit: 1000000,
//  curtime: 1526726571,
//  bits: '1d0e6cf3',
//  height: 4678804,
//  difficulty: 2.01235894 }

	// set a new BlockTemplate
	currentBlockTemplate = new BlockTemplate(template);



}


function processBlockTemplate(template){

    if (currentBlockTemplate)
        validBlockTemplates.push(currentBlockTemplate);

    if (validBlockTemplates.length > 3)
        validBlockTemplates.shift();

    currentBlockTemplate = new BlockTemplate(template);

    for (var minerId in connectedMiners){
        var miner = connectedMiners[minerId];
        miner.pushMessage('job', miner.getJob());
    }
}



(function init(){
    jobRefresh(true, function(sucessful){
        if (!sucessful){
            log('error', logSystem, 'Could not start pool');
            return;
        }
        startPoolServerTcp(function(successful){

        });
    });
})();

var VarDiff = (function(){
    var variance = config.poolServer.varDiff.variancePercent / 100 * config.poolServer.varDiff.targetTime;
    return {
        variance: variance,
        bufferSize: config.poolServer.varDiff.retargetTime / config.poolServer.varDiff.targetTime * 4,
        tMin: config.poolServer.varDiff.targetTime - variance,
        tMax: config.poolServer.varDiff.targetTime + variance,
        maxJump: config.poolServer.varDiff.maxJump
    };
})();

function Miner(id, login, pass, ip, startingDiff, pushMessage){
    this.id = id;
    this.login = login;
    this.pass = pass;
    this.ip = ip;
    this.pushMessage = pushMessage;
    this.heartbeat();
    this.difficulty = startingDiff;
    this.validJobs = [];

    // Vardiff related variables
    this.shareTimeRing = utils.ringBuffer(16);
    this.lastShareTime = Date.now() / 1000 | 0;

    if (shareTrustEnabled) {
        this.trust = {
            threshold: config.poolServer.shareTrust.threshold,
            probability: 1,
            penalty: 0
        };
    }
}
Miner.prototype = {
    retarget: function(now){

        var options = config.poolServer.varDiff;

        var sinceLast = now - this.lastShareTime;
        var decreaser = sinceLast > VarDiff.tMax;

        var avg = this.shareTimeRing.avg(decreaser ? sinceLast : null);
        var newDiff;

        var direction;

        if (avg > VarDiff.tMax && this.difficulty > options.minDiff){
            newDiff = options.targetTime / avg * this.difficulty;
            newDiff = newDiff > options.minDiff ? newDiff : options.minDiff;
            direction = -1;
        }
        else if (avg < VarDiff.tMin && this.difficulty < options.maxDiff){
            newDiff = options.targetTime / avg * this.difficulty;
            newDiff = newDiff < options.maxDiff ? newDiff : options.maxDiff;
            direction = 1;
        }
        else{
            return;
        }

        if (Math.abs(newDiff - this.difficulty) / this.difficulty * 100 > options.maxJump){
            var change = options.maxJump / 100 * this.difficulty * direction;
            newDiff = this.difficulty + change;
        }

        this.setNewDiff(newDiff);
        this.shareTimeRing.clear();
        if (decreaser) this.lastShareTime = now;
    },
    setNewDiff: function(newDiff){
        newDiff = Math.round(newDiff);
        if (this.difficulty === newDiff) return;
        log('info', logSystem, 'Retargetting difficulty %d to %d for %s', [this.difficulty, newDiff, this.login]);
        this.pendingDifficulty = newDiff;
        this.pushMessage('job', this.getJob());
    },
    heartbeat: function(){
        this.lastBeat = Date.now();
    },
    getTargetHex: function(){
        if (this.pendingDifficulty){
            this.lastDifficulty = this.difficulty;
            this.difficulty = this.pendingDifficulty;
            this.pendingDifficulty = null;
        }

        var padded = new Buffer(32);
        padded.fill(0);

        var diffBuff = diff1.div(this.difficulty).toBuffer();
        diffBuff.copy(padded, 32 - diffBuff.length);

        var buff = padded.slice(0, 4);
        var buffArray = buff.toJSON();
        buffArray.reverse();
        var buffReversed = new Buffer(buffArray);
        this.target = buffReversed.readUInt32BE(0);
        var hex = buffReversed.toString('hex');
        return hex;
    },
    getJob: function(){
        if (this.lastBlockHeight === currentBlockTemplate.height && !this.pendingDifficulty) {
            return {
                blob: '',
                job_id: '',
                target: ''
            };
        }

        var blob = currentBlockTemplate.nextBlob();
        this.lastBlockHeight = currentBlockTemplate.height;
        var target = this.getTargetHex();

        var newJob = {
            id: utils.uid(),
            extraNonce: currentBlockTemplate.extraNonce,
            height: currentBlockTemplate.height,
            difficulty: this.difficulty,
            score: this.score,
            diffHex: this.diffHex,
            submissions: []
        };

        this.validJobs.push(newJob);

        if (this.validJobs.length > 4)
            this.validJobs.shift();

        return {
            blob: blob,
            job_id: newJob.id,
            target: target,
            id: this.id
        };
    },
    checkBan: function(validShare){
        if (!banningEnabled) return;

        // Init global per-IP shares stats
        if (!perIPStats[this.ip]){
            perIPStats[this.ip] = { validShares: 0, invalidShares: 0 };
        }

        var stats = perIPStats[this.ip];
        validShare ? stats.validShares++ : stats.invalidShares++;

        if (stats.validShares + stats.invalidShares >= config.poolServer.banning.checkThreshold){
            if (stats.invalidShares / stats.validShares >= config.poolServer.banning.invalidPercent / 100){
                log('warn', logSystem, 'Banned %s@%s', [this.login, this.ip]);
                bannedIPs[this.ip] = Date.now();
                delete connectedMiners[this.id];
                process.send({type: 'banIP', ip: this.ip});
            }
            else{
                stats.invalidShares = 0;
                stats.validShares = 0;
            }
        }
    }
};



function recordShareData(miner, job, shareDiff, blockCandidate, hashHex, shareType, blockTemplate){

    var dateNow = Date.now();
    var dateNowSeconds = dateNow / 1000 | 0;

    //Weighting older shares lower than newer ones to prevent pool hopping
    if (config.poolServer.slushMining.enabled) {                
        if (lastChecked + config.poolServer.slushMining.lastBlockCheckRate <= dateNowSeconds || lastChecked == 0) {
            redisClient.hget(config.coin + ':stats', 'lastBlockFound', function(error, result) {
                if (error) {
                    log('error', logSystem, 'Unable to determine the timestamp of the last block found');
                    return;
                }
                scoreTime = result / 1000 | 0; //scoreTime could potentially be something else than the beginning of the current round, though this would warrant changes in api.js (and potentially the redis db)
                lastChecked = dateNowSeconds;
            });
        }
        
        job.score = job.difficulty * Math.pow(Math.E, ((dateNowSeconds - scoreTime) / config.poolServer.slushMining.weight)); //Score Calculation
        log('info', logSystem, 'Submitted score ' + job.score + ' with difficulty ' + job.difficulty + ' and the time ' + scoreTime);
    }
    else {
        job.score = job.difficulty;
    }

    var redisCommands = [
        ['hincrby', config.coin + ':shares:roundCurrent', miner.login, job.score],
        ['zadd', config.coin + ':hashrate', dateNowSeconds, [job.difficulty, miner.login, dateNow].join(':')],
        ['hincrby', config.coin + ':workers:' + miner.login, 'hashes', job.difficulty],
        ['hset', config.coin + ':workers:' + miner.login, 'lastShare', dateNowSeconds]
    ];

    if (blockCandidate){
        redisCommands.push(['hset', config.coin + ':stats', 'lastBlockFound', Date.now()]);
        redisCommands.push(['rename', config.coin + ':shares:roundCurrent', config.coin + ':shares:round' + job.height]);
        redisCommands.push(['hgetall', config.coin + ':shares:round' + job.height]);
    }

    redisClient.multi(redisCommands).exec(function(err, replies){
        if (err){
            log('error', logSystem, 'Failed to insert share data into redis %j \n %j', [err, redisCommands]);
            return;
        }
        if (blockCandidate){
            var workerShares = replies[replies.length - 1];
            var totalShares = Object.keys(workerShares).reduce(function(p, c){
                return p + parseInt(workerShares[c])
            }, 0);
            redisClient.zadd(config.coin + ':blocks:candidates', job.height, [
                hashHex,
                Date.now() / 1000 | 0,
                blockTemplate.difficulty,
                totalShares
            ].join(':'), function(err, result){
                if (err){
                    log('error', logSystem, 'Failed inserting block candidate %s \n %j', [hashHex, err]);
                }
            });
        }

    });

    log('info', logSystem, 'Accepted %s share at difficulty %d/%d from %s@%s', [shareType, job.difficulty, shareDiff, miner.login, miner.ip]);

}

function processShare(miner, job, blockTemplate, nonce, resultHash){
    var shareBuffer = new Buffer(blockTemplate.buffer.length);
    blockTemplate.buffer.copy(shareBuffer);
    shareBuffer.writeUInt32BE(job.extraNonce, blockTemplate.reserveOffset);
    new Buffer(nonce, 'hex').copy(shareBuffer, 39);

    var convertedBlob;
    var hash;
    var shareType;

    if (shareTrustEnabled && miner.trust.threshold <= 0 && miner.trust.penalty <= 0 && Math.random() > miner.trust.probability){
        hash = new Buffer(resultHash, 'hex');
        shareType = 'trusted';
    }
    else {
        convertedBlob = cnUtil.convert_blob(shareBuffer);
        hash = cryptoNight(convertedBlob);
        shareType = 'valid';
    }


    if (hash.toString('hex') !== resultHash) {
        log('warn', logSystem, 'Bad hash from miner %s@%s', [miner.login, miner.ip]);
        return false;
    }

    var hashArray = hash.toJSON();
    hashArray.reverse();
    var hashNum = bignum.fromBuffer(new Buffer(hashArray));
    var hashDiff = diff1.div(hashNum);



    if (hashDiff.ge(blockTemplate.difficulty)){

        apiInterfaces.rpcDaemon('submitblock', [shareBuffer.toString('hex')], function(error, result){
            if (error){
                log('error', logSystem, 'Error submitting block at height %d from %s@%s, share type: "%s" - %j', [job.height, miner.login, miner.ip, shareType, error]);
                recordShareData(miner, job, hashDiff.toString(), false, null, shareType);
            }
            else{
                var blockFastHash = cryptoNightFast(convertedBlob || cnUtil.convert_blob(shareBuffer)).toString('hex');
                log('info', logSystem,
                    'Block %s found at height %d by miner %s@%s - submit result: %j',
                    [blockFastHash.substr(0, 6), job.height, miner.login, miner.ip, result]
                );
                recordShareData(miner, job, hashDiff.toString(), true, blockFastHash, shareType, blockTemplate);
                jobRefresh();
            }
        });
    }

    else if (hashDiff.lt(job.difficulty)){
        log('warn', logSystem, 'Rejected low difficulty share of %s from %s@%s', [hashDiff.toString(), miner.login, miner.ip]);
        return false;
    }
    else{
        recordShareData(miner, job, hashDiff.toString(), false, null, shareType);
    }

    return true;
}


function handleMinerMethod(method, params, ip, portData, sendReply, pushMessage){


    var miner = connectedMiners[params.id];

    // Check for ban here, so preconnected attackers can't continue to screw you
    if (IsBannedIp(ip)){
        sendReply('your IP is banned');
        return;
    }

    switch(method){
        case 'login':
            if (!params.login){
                sendReply('missing login');
                return;
            }
            if (!utils.isValidAddress(params.login, config.poolServer.poolAddress[0])){
                sendReply('invalid address used for login');
                return;
            }
            var minerId = utils.uid();
            miner = new Miner(minerId, params.login, params.pass, ip, portData.difficulty, pushMessage);
            connectedMiners[minerId] = miner;
            sendReply(null, {
                id: minerId,
                job: miner.getJob(),
                status: 'OK'
            });
            log('info', logSystem, 'Miner connected %s@%s',  [params.login, miner.ip]);
            break;
        case 'getjob':
            if (!miner){
                sendReply('Unauthenticated');
                return;
            }
            miner.heartbeat();
            sendReply(null, miner.getJob());
            break;
        case 'submit':
            if (!miner){
                sendReply('Unauthenticated');
                return;
            }
            miner.heartbeat();

            var job = miner.validJobs.filter(function(job){
                return job.id === params.job_id;
            })[0];

            if (!job){
                sendReply('Invalid job id');
                return;
            }

            if (!noncePattern.test(params.nonce)) {
                var minerText = miner ? (' ' + miner.login + '@' + miner.ip) : '';
                log('warn', logSystem, 'Malformed nonce: ' + JSON.stringify(params) + ' from ' + minerText);
                perIPStats[miner.ip] = { validShares: 0, invalidShares: 999999 };
                miner.checkBan(false);
                sendReply('Duplicate share');
                return;
            }

            // Force lowercase for further comparison
            params.nonce = params.nonce.toLowerCase();

            if (job.submissions.indexOf(params.nonce) !== -1){
                 var minerText = miner ? (' ' + miner.login + '@' + miner.ip) : '';
                 log('warn', logSystem, 'Duplicate share: ' + JSON.stringify(params) + ' from ' + minerText);
                 perIPStats[miner.ip] = { validShares: 0, invalidShares: 999999 };
                 miner.checkBan(false);
                 sendReply('Duplicate share');
                 return;
            }

            job.submissions.push(params.nonce);

            var blockTemplate = currentBlockTemplate.height === job.height ? currentBlockTemplate : validBlockTemplates.filter(function(t){
                return t.height === job.height;
            })[0];

            if (!blockTemplate){
                sendReply('Block expired');
                return;
            }

            var shareAccepted = processShare(miner, job, blockTemplate, params.nonce, params.result);
            miner.checkBan(shareAccepted);
            if (shareTrustEnabled){
                if (shareAccepted){
                    miner.trust.probability -= shareTrustStepFloat;
                    if (miner.trust.probability < shareTrustMinFloat)
                        miner.trust.probability = shareTrustMinFloat;
                    miner.trust.penalty--;
                    miner.trust.threshold--;
                }
                else{
                    log('warn', logSystem, 'Share trust broken by %s@%s', [miner.login, miner.ip]);
                    miner.trust.probability = 1;
                    miner.trust.penalty = config.poolServer.shareTrust.penalty;
                }
            }

            if (!shareAccepted){
                sendReply('Low difficulty share');
                return;
            }

            var now = Date.now() / 1000 | 0;
            miner.shareTimeRing.append(now - miner.lastShareTime);
            miner.lastShareTime = now;
            //miner.retarget(now);

            sendReply(null, {status: 'OK'});
            break;
        case 'keepalived' :
            if (!miner){
                sendReply('Unauthenticated');
                return;
            }
            miner.heartbeat()
            sendReply(null, { status:'KEEPALIVED' });
            break;
        default:
            sendReply("invalid method");
            var minerText = miner ? (' ' + miner.login + '@' + miner.ip) : '';
            log('warn', logSystem, 'Invalid method: %s (%j) from %s', [method, params, minerText]);
            break;
    }
}


var httpResponse = ' 200 OK\nContent-Type: text/plain\nContent-Length: 20\n\nmining server online';


function startPoolServerTcp(callback){
    async.each(config.poolServer.ports, function(portData, cback){
        var handleMessage = function(socket, jsonData, pushMessage){
            if (!jsonData.id) {
                log('warn', logSystem, 'Miner RPC request missing RPC id');
                return;
            }
            else if (!jsonData.method) {
                log('warn', logSystem, 'Miner RPC request missing RPC method');
                return;
            }
            else if (!jsonData.params) {
                log('warn', logSystem, 'Miner RPC request missing RPC params');
                return;
            }

            var sendReply = function(error, result){
                if(!socket.writable) return;
                var sendData = JSON.stringify({
                    id: jsonData.id,
                    jsonrpc: "2.0",
                    error: error ? {code: -1, message: error} : null,
                    result: result
                }) + "\n";
                socket.write(sendData);
            };

            handleMinerMethod(jsonData.method, jsonData.params, socket.remoteAddress, portData, sendReply, pushMessage);
        };

        net.createServer(function(socket){
            socket.setKeepAlive(true);
            socket.setEncoding('utf8');

            var dataBuffer = '';

            var pushMessage = function(method, params){
                if(!socket.writable) return;
                var sendData = JSON.stringify({
                    jsonrpc: "2.0",
                    method: method,
                    params: params
                }) + "\n";
                socket.write(sendData);
            };

            socket.on('data', function(d){
                dataBuffer += d;
                if (Buffer.byteLength(dataBuffer, 'utf8') > 10240){ //10KB
                    dataBuffer = null;
                    log('warn', logSystem, 'Socket flooding detected and prevented from %s', [socket.remoteAddress]);
                    socket.destroy();
                    return;
                }
                if (dataBuffer.indexOf('\n') !== -1){
                    var messages = dataBuffer.split('\n');
                    var incomplete = dataBuffer.slice(-1) === '\n' ? '' : messages.pop();
                    for (var i = 0; i < messages.length; i++){
                        var message = messages[i];
                        if (message.trim() === '') continue;
                        var jsonData;
                        try{
                            jsonData = JSON.parse(message);
                        }
                        catch(e){
                            if (message.indexOf('GET /') === 0) {
                                if (message.indexOf('HTTP/1.1') !== -1) {
                                    socket.end('HTTP/1.1' + httpResponse);
                                    break;
                                }
                                else if (message.indexOf('HTTP/1.0') !== -1) {
                                    socket.end('HTTP/1.0' + httpResponse);
                                    break;
                                }
                            }

                            log('warn', logSystem, 'Malformed message from %s: %s', [socket.remoteAddress, message]);
                            socket.destroy();

                            break;
                        }
                        handleMessage(socket, jsonData, pushMessage);
                    }
                    dataBuffer = incomplete;
                }
            }).on('error', function(err){
                if (err.code !== 'ECONNRESET')
                    log('warn', logSystem, 'Socket error from %s %j', [socket.remoteAddress, err]);
            }).on('close', function(){
                pushMessage = function(){};
            });

        }).listen(portData.port, function (error, result) {
            if (error) {
                log('error', logSystem, 'Could not start server listening on port %d, error: $j', [portData.port, error]);
                cback(true);
                return;
            }
            log('info', logSystem, 'Started server listening on port %d', [portData.port]);
            cback();
        });

    }, function(err){
        if (err)
            callback(false);
        else
            callback(true);
    });
}




