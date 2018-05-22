var http = require('http');
var https = require('https');
var MintCoin = require('./index.js')
// Options for development
	var debug = false
    var debugWrite =false
//var MintCoin = require('./MintCoinApiInterface.js')

var RPCClient = function (opts) {
  this.opts = opts || {}
  this.http = this.opts.ssl ? https : http
}

function LogWrite(method,response,error,params){

var version = 'v2.0.3.99-14ad262'
var fs = require('fs');
var time = Date.now()
if (debug) console.log(' Minty is writing :')
ROOT_APP_PATH = fs.realpathSync('.'); console.log(ROOT_APP_PATH);
/// write to file
var txtFile = "./lib_dev/log/"+time+"_"+version+"_"+method+".txt"


var stream = fs.createWriteStream(txtFile);
stream.once('open', function(fd) {
  stream.write('method: '+method+' \n\n');
  stream.write('params: '+JSON.stringify(params)+' \n\n'); 
  stream.write('response: '+JSON.stringify(response)+' \n\n');  
  stream.write('error: '+JSON.stringify(error)+' \n\n');
  stream.end();
});

}

function jsonHttpReqMint(host, port, data, callback){
	//function (method, params, callback, errback, path)
	if (debug) console.log('A Minty Http Request host: %s ',host)
	if (debug) console.log('A Minty Http Request port: %s ',port)
	if (debug) console.log('A Minty Http Request data: %s ',JSON.stringify(data))
	if (debug) console.log('A Minty Http Request callback: %s ',callback)

	var u = config.daemon.rpcuser
	var p = config.daemon.rpcpassword
	var url = "http://127.0.0.1";
	// check callback it is undefined normally it holds the correct function error result
	// // if so use eval to make it a function again
	//var objData = JSON.parse(data)
    var method =data.method
	var params = data.params
	// TODO: do also something with the params
    //make the reply object(should come from callback)
	var replyJson = {result:"",error:""}
    

	
if (!debug) console.log('A Minty method parsed from data: %s ',method)	
if (!debug) console.log('Minty params parsed from data: %s ',JSON.stringify(params))
if (debug) console.log('A Minty method parsed from replyJson: %s ',replyJson.error)
if (debug) console.log('A Minty method parsed from replyJson: %s ',replyJson.result)
	// all config options are optional

	var client = new MintCoin.Client({
  		host: host,
  		port: port,
  		user: u,
  		pass: p,
  		timeout: 30000
		});

	if (debug) console.log('A Minty Http Request host: %s ',host)
	if (debug) console.log('A Minty Http Request port: %s ',port)
	if (debug) console.log('A Minty Http Request method: %s ',method)
	if (debug) console.log('A Minty Http Request response: %s ',JSON.stringify(data))

	if (debug) console.log('A Minty Http Request callback: %s ',JSON.stringify(callback))

	//print all the available commands to the console (only for developing)
	var commands = require('./commands.js')

	for (i in commands)
	{
	//	if(debug){console.log('command:', commands[i]);}
    }

	//TODO modify according latest version
if (method == 'getinfo') {
	    if (!debug) console.log(' Minty is executing %s :'),method;
    	
    	client.getinfo(function(err, result, resHeaders) {
        
  			//What to do if there is an error
        	if (err){
            	if (debugWrite) LogWrite(method,result,err,data);
            	if (debug) console.log(err);
            	callback(error);
            	}
        	
        	//What to do if there is a response
        	if (debugWrite) LogWrite(method,result,err,data);
  			if (debug) console.log('result:', result);
        	// you can do formatting stuff here
        	
        	//but at the end do a callback
			callback(err, result)
        	});
    
    
    //--------------------------------------//
    // Dummy Function always take a copy
    //--------------------------------------//
	
    } 
else if (method == 'dummy') {
    	
    	client.getinfo(function(err, result, resHeaders) {
        
  			//What to do if there is an error
        	if (err){
            	if (debugWrite) LogWrite(method,result,err,params);
            	if (debug) console.log(err);
            	return;
            	}
        	
        	//What to do if there is a response
        	if (debugWrite) LogWrite(method,result,err,params);
  			if (debug) console.log('result:', result);
        	// you can do formatting stuff here
			});

     //--------------------------------------//
    // getlastblockheader simulated
    //--------------------------------------//
		
    } 
else if (method == 'getlastblockheader') {
		//host, port, data, callback
	    if (!debug) console.log('Minty is executing %s :', method);
    	if (debug) console.log('A Minty method parsed from object: %s ',method)
    	if (debug) console.log('A Minty host: %s ',host)
    	if (debug) console.log('A Minty port: %s ',port)

    	if (debug) console.log('A Minty method: %s ',data.method)
    	if (debug) console.log('A Minty params: %s ',JSON.stringify(data))

    	if (debug) console.log('A Minty port: %s ',callback)

		if (debug) console.log('A Minty method parsed from object: %s ',replyJson.error)
		if (debug) console.log('A Minty method parsed from object: %s ',replyJson.result)
    	var error = ""
    	// wrong function until the right one exists
    	client.getInfo(function(err, result, resHeaders) {       
  			//What to do if there is an error
        	if (err){
            	if (debugWrite) LogWrite(method,result,err,data);
            	error = err
            	if (debug) console.log(error);
            		callback(error);
            	}
        	
        	//What to do if there is a response
        	if (debugWrite) LogWrite(method,result,error,data);
        	// you can do formatting stuff here
        	// 
//        	console.log(result);
      	    var replyJson = {
        		id: "0",
        		jsonrpc: "2.0",
            	result:{
        		block_header:{
                        		depth:1,
                        		difficulty:result.difficulty,
								height: 123456,
					            timestamp: 1356589561,
					            reward: 44090506423186,
					            hash:  "000000000000000000f37fddab6ae59b06d55c9949c4bf35151b7776ff551897"
                        	 }
            },
                status : "OK"
   			 };
	        // add some to the array to look like BTC

        	callback(error, replyJson)
        	});
    
    } 
else if (method == 'getblocktemplate') {

	    if (debug) console.log(' Minty is executing %s :'),method;
        if (debug) console.log('A Minty method parsed from object: %s ',method)
		if (debug) console.log('A Minty method parsed from object: %s ',replyJson.error)
		if (debug) console.log('A Minty method parsed from object: %s ',replyJson.result)
    	// wrong function until the right one exists
    	client.getBlockTemplate(function(err, result, resHeaders) {
        
  			//What to do if there is an error
        	if (err){
            	if (debugWrite) LogWrite(objMethod.method,result,err,data);
            	if (debug) console.log(err);
            	replyJson.error = err
            	callback(replyJson.error);
            	}
        	
        	//What to do if there is a response
        	if (debugWrite) LogWrite(objMethod.method,result,err,data);

        	//replyJson.result = JSON.stringify(result)
        	
       // if (debug) console.log('Send to function', replyJson.result);
       
        // add some to the array to look like BTC
        result.difficulty = 2.01235894
        
        var replyJson = {
        		id: "0",
        		jsonrpc: "2.0",
        		result:{
                		depth:1,
                        difficulty: 2.01235894,
						height: 123456,
					    timestamp: 1356589561,
					    reward: 44090506423186,
					    hash:  "000000000000000000f37fddab6ae59b06d55c9949c4bf35151b7776ff551897",                
                		status : "OK"
                		}
   			 };
        
        replyJson = {
        		id: "0",
        		jsonrpc: "2.0",
        		result:result
   			 };
        	// you can do formatting stuff here
        	//
        	//
        	var error = ""
        	callback(error, replyJson)
        	});
    
    //--------------------------------------//
    // The escape route
    //--------------------------------------//       
    } 
else if (method == 'getblockheaderbyheight') {
// https://getmonero.org/resources/developer-guides/daemon-rpc.html#getblockheaderbyheight
// getblock
// Full block information can be retrieved by either block height or hash, like with the above block header calls. 
// For full block information, both lookups use the same method, but with different input parameters.
//
// Inputs (pick one of the following):
//
// height - unsigned int; The block's height.
// hash - string; The block's hash.
	    if (debug) console.log(' Minty is executing %s :'),method;
        if (debug) console.log('A Minty method parsed from object: %s ',method)
		if (debug) console.log('A Minty method parsed from object: %s ',replyJson.error)
		if (debug) console.log('A Minty method parsed from object: %s ',replyJson.result)
return		
    	// wrong function until the right one exists
    	client.getBlock(function(err, result, resHeaders) {
        
  			//What to do if there is an error
        	if (err){
            	if (debugWrite) LogWrite(objMethod.method,result,err,data);
            	if (debug) console.log(err);
            	replyJson.error = err
            	callback(replyJson.error);
            	}
        	
        	//What to do if there is a response
        	if (debugWrite) LogWrite(objMethod.method,result,err,data);

        	//replyJson.result = JSON.stringify(result)
        	
       // if (debug) console.log('Send to function', replyJson.result);
       
        // add some to the array to look like BTC
        result.difficulty = 2.01235894
        
        var replyJson = {
        		id: "0",
        		jsonrpc: "2.0",
        		result:{
                		depth:1,
                        difficulty: 2.01235894,
						height: 123456,
					    timestamp: 1356589561,
					    reward: 44090506423186,
					    hash:  "000000000000000000f37fddab6ae59b06d55c9949c4bf35151b7776ff551897",                
                		status : "OK"
                		}
   			 };
        
        replyJson = {
        		id: "0",
        		jsonrpc: "2.0",
        		result:result
   			 };
//        replyJson = {
//  "id": "0",
//  "jsonrpc": "2.0",
//  "result": {
//    "block_header": {
//      "depth": 78376,
//      "difficulty": 815625611,
//      "hash": "e22cf75f39ae720e8b71b3d120a5ac03f0db50bba6379e2850975b4859190bc6",
//      "height": 912345,
//      "major_version": 1,
//      "minor_version": 2,
//      "nonce": 1646,
//      "orphan_status": false,
//      "prev_hash": "b61c58b2e0be53fad5ef9d9731a55e8a81d972b8d90ed07c04fd37ca6403ff78",
//      "reward": 7388968946286,
//      "timestamp": 1452793716
//    },
//    "status": "OK"
//  }
//}
        	// you can do formatting stuff here
        	//
        	//
        	var error = ""
        	callback(error, replyJson)
        	});
    
       
    } 
else if (method == 'getpeerinfo') {
   			
    	client.getPeerInfo(function(err, result, resHeaders) {
       	if (!debug) console.log(' Minty is executing %s :'),method;
        if (!debug) console.log('A Minty method parsed from object: %s ',method)
//		if (!debug) console.log('A Minty method parsed from object: %s ',replyJson.error)
//		if (!debug) console.log('A Minty method parsed from object: %s ',replyJson.result)
        
  			//What to do if there is an error
        	if (err){
            	if (debugWrite) LogWrite(method,result,err,params);
            	if (!debug) console.log(err);
            	return;
            	}
        	
        	//What to do if there is a response
        	if (debugWrite) LogWrite(method,result,err,params);
 // 			if (!debug) console.log('result:', result);
        	// you can do formatting stuff here
        	// 
        	// 
        	for (var Peer in result){
					//console.log('new ' + JSON.stringify(Peer) + JSON.stringify(result[Peer].addr));
    			} 
        
		   var replyJson = {
        		id: "0",
        		jsonrpc: "2.0",
        		result: result
   			 };
                	var error = ""
            //if (debug) console.log('result:', JSON.stringify(replyJson));
        	callback(err, replyJson)
        	
			});
				




     //--------------------------------------//
    // getlastblockheader simulated
    //--------------------------------------//
		
    } 
else {
    //if (debugWrite) LogWrite(method,result,err,params);
    if (debug) {console.log(' Minty is cannot execute a command \( %s \) that you imagined',method)}
    replyJson.error = ' Minty cannot execute a command \( ' + method + ' \) that you imagined'
    callback(replyJson.error)
	}	




}

function jsonHttpRequest(host, port, data, callback){

    var options = {
        hostname: host,
        port: port,
        path: '/json_rpc',
        method: 'POST',
        headers: {
            'Content-Length': data.length,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    var req = http.request(options, function(res){
        var replyData = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            replyData += chunk;
        });
        res.on('end', function(){
            var replyJson;
            try{
                replyJson = JSON.parse(replyData);
            }
            catch(e){
                callback(e);
                return;
            }
            callback(null, replyJson);
        });
    });

    req.on('error', function(e){
        callback(e);
    });

    req.end(data);
}

function rpc(host, port, method, params, callback){
	if (debug) console.log('rpc coin: %s ',config.symbol)
	if (debug) console.log('rpc host: %s ',host)
	if (debug) console.log('rpc port: %s ',port)
	if (debug) console.log('rpc method: %s ',method)
	if (debug) console.log('rpc params: %s ',params)

//console.log('callback: %s \n',callback)
    var data = JSON.stringify({
        id: "0",
        jsonrpc: "2.0",
        method: method,
        params: params
    });
if (config.symbol =='MINT'){
		// It is the Minty Coin
	var data = {
     		id: "0",
      		jsonrpc: "2.0",
    		method: method,
     		params: params};
    
		if (debug) console.log('Callin MINTY HTTP: %s ',config.symbol);
		if (debug) console.log('rpc coin M: %s ',config.symbol)
		if (debug) console.log('rpc host M: %s ',host)
		if (debug) console.log('rpc port M: %s ',port)
//		if (debug) console.log('rpc method M: %s 'method)
//		if (debug) console.log('rpc params M: %s ',params)
		if (debug) console.log('rpc data M: %s ',data)

    	jsonHttpReqMint(host, port, data, function(error, replyJson){
        	if (error){
        		console.log('rpc : %s ',replyJson)        
        		console.log('rpc : %s ',error)
    	        callback(error);
	            return;
        	}
        	callback(error, replyJson.result)
    	});



	}else{
    	// if it is not MINT
    	// 
    var data = JSON.stringify({
        id: "0",
        jsonrpc: "2.0",
        method: method,
        params: params
    		});
    
    	if (debug) console.log('Callin STANDARD HTTP: %s ',config.symbol);
    	jsonHttpRequest(host, port, data, function(error, replyJson){
        
        
        	if (error){
        		console.log('rpc : %s ',replyJson)        
        		console.log('rpc : %s ',error)
    	        callback(error);
	            return;
        	}
        	callback(replyJson.error, replyJson.result)
    	});
	}
}

function rpcMint(host, port, method, params, callback){
//	method='getinfo'
	if (debug) console.log('rpc MINT host: %s ',host)
	if (debug) console.log('rpc MINT port: %s ',port)
	if (debug) console.log('rpc MINT method: %s ',method)
	if (debug) console.log('rpc MINT params: %s ',JSON.stringify(params))
	if (debug) console.log('rpc MINT callback: %s ',JSON.stringify(params))

	//console.log('callback: %s \n',callback)
 
    jsonHttpReqMint(host, port, method, params, function(error, replyJson){
    
          	    var replyJson = JSON.stringify({
        		id: "0",
        		jsonrpc: "2.0",
        		result:{
                		block_header:{
                        				"depth":1,
                        				"difficulty":65198,
										"height": 123456,
					                    "timestamp": 1356589561,
					                    "reward": 44090506423186,
					                    "hash":  "000000000000000000f37fddab6ae59b06d55c9949c4bf35151b7776ff551897"
                        
                        			 },
                "status" : "OK",
                 "error" : "OK"

                		}
   			 });
    
        if (error){
        	console.log('rpc Mint: %s ',replyJson)        
        	console.log('rpc Mint: %s ',error)
            callback(error);
            return;
        }
        callback(error, replyJson.result)
    });
}
function batchRpc(host, port, array, callback){

	console.log('batch rpc host: %s \n',host)
	console.log('batch rpc port: %s \n',port)
	console.log('batch rpc array: %s \n',array)
	console.log('batch rpc params: %s \n',callback)

    var rpcArray = [];
    for (var i = 0; i < array.length; i++){
        rpcArray.push({
            id: i.toString(),
            jsonrpc: "2.0",
            method: array[i][0],
            params: array[i][1]
        });
    }
    var data = JSON.stringify(rpcArray);
    jsonHttpRequest(host, port, data, callback);
}


module.exports = function(daemonConfig, walletConfig){
    return {
        batchRpcDaemon: function(batchArray, callback){
            batchRpc(daemonConfig.host, daemonConfig.port, batchArray, callback);
        },
        rpcDaemon: function(method, params, callback){
            rpc(daemonConfig.host, daemonConfig.port, method, params, callback);
        },
        rpcWallet: function(method, params, callback){
            rpc(walletConfig.host, walletConfig.port, method, params, callback);
        },
        rpcMintDaemon: function(method, params, callback){
            rpcMint(daemonConfig.host, daemonConfig.port, method, params, callback);
        }
    }
};