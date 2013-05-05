
var Logger = {
log: function(msg) {
			console.log('\n' + msg);
		},
rawInput: function (data){
				var regex = /purpled/;
				if(regex.exec(data)){
					console.log('FOUND REGEX');
					sendToBrowser(data);
				}
				console.log("\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\nReceived:", data + '\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
			},
rawOutput: function (data){
				console.log("\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\nSent:", data + '\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
			},
iqSuccess: function (){
				console.log('message angekommen');
			},
iqError: function (){
				console.log('message fehlerhaft');
			}
};

exports.Logger = Logger;