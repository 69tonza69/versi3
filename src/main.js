const LineAPI = require('./api');
const request = require('request');
const fs = require('fs');
const unirest = require('unirest');
const webp = require('webp-converter');
const rp = require('request-promise');
const config = require('./config');
const { Message, OpType, Location } = require('../curve-thrift/line_types');
let exec = require('child_process').exec;

const myBot = ['ufdb348d53532a57228f045ecfaa00f8d','ue5060e54a4ed380dcafd0a2213592ad0','ua044c625da53442ff1040e30bfb1ee28','u93c7c5d46bc99b92c09faede05b7e8b6'];//INSERT YOUR ADMIN MID HERE
var vx = {};var midnornama = "";var pesane = "";var kickhim = "";var waitMsg = "no";//DO NOT CHANGE THIS
var banList = [];//Banned list
var komenTL = "AutoLike by Hallucination"; //Comment for timeline
var limitposts = '10'; //Output timeline post

function isAdminOrBot(param) {
    return myBot.includes(param);
}

function isBanned(banList, param) {
    return banList.includes(param);
}

function firstToUpperCase(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1);
}

function isTGet(string,param){
	return string.includes(param);
}

class LINE extends LineAPI {
    constructor() {
        super();
		this.limitposts = limitposts; //Output timeline post
        this.receiverID = '';
        this.checkReader = [];
        this.stateStatus = {
            cancel: 0, //0 = Auto cancel off, 1 = on
            kick: 1, //1 = Yes, 0 = No
			salam: 1, //1 = Yes, 0 = No
			mute: 0, //1 = Mute, 0 = Unmute
			protect: 1, //Protect Qr,Kicker
			qr: 0 //0 = Gk boleh, 1 = Boleh
        }
		this.keyhelp = "\n\
====================\n\
# Keyword List\n\n\
=> addcontact *ADMIN*\n\
=> ban *ADMIN*\n\
=> banlist\n\
=> botleft *ADMIN*\n\
=> cancel\n\
=> cekid\n\
=> gURL\n\
=> ginfo\n\
=> halo\n\
=> kepo\n\
=> key\n\
=> kickban *ADMIN*\n\
=> kickall *ADMIN*\n\
=> kickme\n\
=> msg\n\
=> mute *ADMIN*\n\
=> myid\n\
=> sendcontact\n\
=> setting\n\
=> speed\n\
=> tagall\n\
=> unmute *ADMIN*\n\
=> unban *ADMIN*\n\
=> youtube\n\
\n\n# Gunakan bot dengan bijak ^_^";
        var that = this;
    }

    getOprationType(operations) {
        for (let key in OpType) {
            if(operations.type == OpType[key]) {
                if(key !== 'NOTIFIED_UPDATE_PROFILE') {
                    console.info(`[* ${operations.type} ] ${key} `);
                }
            }
        }
    }

    poll(operation) {
        if(operation.type == 25 || operation.type == 26) {
            const txt = (operation.message.text !== '' && operation.message.text != null ) ? operation.message.text : '' ;
            let message = new Message(operation.message);
            this.receiverID = message.to = (operation.message.to === myBot[0]) ? operation.message.from_ : operation.message.to ;
            Object.assign(message,{ ct: operation.createdTime.toString() });
            if(waitMsg == "yes" && operation.message.from_ == vx[0] && this.stateStatus.mute != 1){
				this.textMessage(txt,message,message.text)
			}else if(this.stateStatus.mute != 1){this.textMessage(txt,message);
			}else if(txt == "unmute" && isAdminOrBot(operation.message.from_) && this.stateStatus.mute == 1){
			    this.stateStatus.mute = 0;
			    this._sendMessage(message,"ヽ(^。^)ノ")
		    }else{console.info("muted");}
        }

        if(operation.type == 13 && this.stateStatus.cancel == 1 && !isAdminOrBot(operation.param2)) {//someone inviting..
            this.cancelAll(operation.param1);
        }
		
		if(operation.type == 16 && this.stateStatus.salam == 1){//join group
			let halo = new Message();
			halo.to = operation.param1;
			halo.text = "Hi,";
			this._client.sendMessage(0, halo);
		}
		
		if(operation.type == 17 && this.stateStatus.salam == 1 && isAdminOrBot(operation.param2)) {//ada yang join
		    let halobos = new Message();
			halobos.to = operation.param1;
			halobos.toType = 2;
			halobos.text = "Welcome My lord";
			this._client.sendMessage(0, halobos);
		}else if(operation.type == 17 && this.stateStatus.salam == 1){//ada yang join
			let seq = new Message();
			seq.to = operation.param1;
			//halo.siapa = operation.param2;
			this.textMessage("0101",seq,operation.param2,1);
			//this._client.sendMessage(0, halo);
		}
		
		if(operation.type == 5 && this.stateStatus.salam == 1) {//someone adding me..
            let halo = new Message();
			halo.to = operation.param1;
			halo.text = "Thanks for adding me,\nCreator: rakha";
			this._client.sendMessage(0, halo);
        }

        if(operation.type == 19) { //ada kick
            // op1 = group nya
            // op2 = yang 'nge' kick
            // op3 = yang 'di' kick
            if(isAdminOrBot(operation.param3)) {
                this._inviteIntoGroup(operation.param1,operation.param3);
				var kickhim = 'yes';
            }
            if(isAdminOrBot(operation.param3)){			
				if(this.stateStatus.protect == 1){
					var kickhim = 'yes';
				}
            } 
			if(kickhim=='yes'){
				if(!isAdminOrBot(operation.param2)){
				    this._kickMember(operation.param1,[operation.param2]);
				}var kickhim = 'no';
			}

        }
		
		if(operation.type == 11 && this.stateStatus.protect == 1){//update group (open qr)
		    let seq = new Message();
			seq.to = operation.param1;
			this.textMessage("0103",seq,operation.param2,1);
		}else if(operation.type == 11 && this.stateStatus.qr == 1){
			let seq = new Message();
			seq.to = operation.param1;
			this.textMessage("0104",seq,operation.param2,1);
		}else if(operation.type == 11 && this.stateStatus.qr == 0){
			let seq = new Message();
			seq.to = operation.param1;
			this.textMessage("0103",seq,operation.param2,1);
		}

        if(operation.type == 55){ //ada reader

            const idx = this.checkReader.findIndex((v) => {
                if(v.group == operation.param1) {
                    return v
                }
            })
            if(this.checkReader.length < 1 || idx == -1) {
                this.checkReader.push({ group: operation.param1, users: [operation.param2], timeSeen: [operation.param3] });
            } else {
                for (var i = 0; i < this.checkReader.length; i++) {
                    if(this.checkReader[i].group == operation.param1) {
                        if(!this.checkReader[i].users.includes(operation.param2)) {
                            this.checkReader[i].users.push(operation.param2);
                            this.checkReader[i].timeSeen.push(operation.param3);
                        }
                    }
                }
            }
        }

        if(operation.type == 13) { // diinvite
            if(isAdminOrBot(operation.param2)) {
                return this._acceptGroupInvitation(operation.param1);
            } else {
                return this._cancel(operation.param1,operation.param2);
            }
        }
        this.getOprationType(operation);
    }
	
	aLike(){
		if(config.chanToken && config.doing == "no"){
			config.doing = "ya";
		    this._autoLike(config.chanToken,limitposts,komenTL);
		}
	}

    async cancelAll(gid) {
        let { listPendingInvite } = await this.searchGroup(gid);
        if(listPendingInvite.length > 0){
            this._cancel(gid,listPendingInvite);
        }
    }

    async searchGroup(gid) {
        let listPendingInvite = [];
        let thisgroup = await this._getGroups([gid]);
        if(thisgroup[0].invitee !== null) {
            listPendingInvite = thisgroup[0].invitee.map((key) => {
                return key.mid;
            });
        }
        let listMember = thisgroup[0].members.map((key) => {
            return { mid: key.mid, dn: key.displayName };
        });

        return { 
            listMember,
            listPendingInvite
        }
    }
	
	async matchPeople(param, nama) {//match name
	    for (var i = 0; i < param.length; i++) {
            let orangnya = await this._client.getContacts([param[i]]);
		    if(orangnya[0].displayName == nama){
			    return orangnya;
				break;
		    }
        }
	}
	
	async isInGroup(param, mid) {
		let { listMember } = await this.searchGroup(param);
	    for (var i = 0; i < listMember.length; i++) {
		    if(listMember[i].mid == mid){
			    return listMember[i].mid;
				break;
		    }
        }
	}
	
	async isItFriend(mid){
		let listFriends = await this._getAllContactIds();let friend = "no";
		for(var i = 0; i < listFriends.length; i++){
			if(listFriends[i] == mid){
				friend = "ya";break;
			}
		}
		return friend;
	}

	
	async searchRoom(rid) {
        let thisroom = await this._getRoom(rid);
        let listMemberr = thisroom.contacts.map((key) => {
            return { mid: key.mid, dn: key.displayName };
        });

        return { 
            listMemberr
        }
    }

    setState(seq,param) {
		if(param == 1){
			let isinya = "Setting\n";
			for (var k in this.stateStatus){
                if (typeof this.stateStatus[k] !== 'function') {
					if(this.stateStatus[k]==1){
						isinya += " "+firstToUpperCase(k)+" => on\n";
					}else{
						isinya += " "+firstToUpperCase(k)+" => off\n";
					}
                }
            }this._sendMessage(seq,isinya);
		}else{
        if(isAdminOrBot(seq.from_)){
            let [ actions , status ] = seq.text.split(' ');
            const action = actions.toLowerCase();
            const state = status.toLowerCase() == 'on' ? 1 : 0;
            this.stateStatus[action] = state;
			let isinya = "Setting\n";
			for (var k in this.stateStatus){
                if (typeof this.stateStatus[k] !== 'function') {
					if(this.stateStatus[k]==1){
						isinya += " "+firstToUpperCase(k)+" => on\n";
					}else{
						isinya += " "+firstToUpperCase(k)+" => off\n";
					}
                }
            }
            //this._sendMessage(seq,`Status: \n${JSON.stringify(this.stateStatus)}`);
			this._sendMessage(seq,isinya);
        } else {
            this._sendMessage(seq,`Not permitted!`);
        }}
    }

    mention(listMember) {
        let mentionStrings = [''];
        let mid = [''];
        for (var i = 0; i < listMember.length; i++) {
            mentionStrings.push('@'+listMember[i].displayName+'\n');
            mid.push(listMember[i].mid);
        }
        let strings = mentionStrings.join('');
        let member = strings.split('@').slice(1);
        
        let tmp = 0;
        let memberStart = [];
        let mentionMember = member.map((v,k) => {
            let z = tmp += v.length + 1;
            let end = z - 1;
            memberStart.push(end);
            let mentionz = `{"S":"${(isNaN(memberStart[k - 1] + 1) ? 0 : memberStart[k - 1] + 1 ) }","E":"${end}","M":"${mid[k + 1]}"}`;
            return mentionz;
        })
        return {
            names: mentionStrings.slice(1),
            cmddata: { MENTION: `{"MENTIONEES":[${mentionMember}]}` }
        }
    }
	
	async tagAlls(seq){
		let { listMember } = await this.searchGroup(seq.to);
			seq.text = "";
			let mentionMemberx = [];
            for (var i = 0; i < listMember.length; i++) {
				if(seq.text == null || typeof seq.text === "undefined" || !seq.text){
					let namanya = listMember[i].dn;
				    let midnya = listMember[i].mid;
				    seq.text += "@"+namanya+" \n";
                    let member = [namanya];
        
                    let tmp = 0;
                    let mentionMember1 = member.map((v,k) => {
                        let z = tmp += v.length + 3;
                        let end = z;
                        let mentionz = `{"S":"0","E":"${end}","M":"${midnya}"}`;
                        return mentionz;
                    })
					mentionMemberx.push(mentionMember1);
				    //const tag = {cmddata: { MENTION: `{"MENTIONEES":[${mentionMember}]}` }}
				    //seq.contentMetadata = tag.cmddata;
				    //this._client.sendMessage(0, seq);
				}else{
				    let namanya = listMember[i].dn;
				    let midnya = listMember[i].mid;
					let kata = seq.text.split("");
					let panjang = kata.length;
				    seq.text += "@"+namanya+" \n";
                    let member = [namanya];
        
                    let tmp = 0;
                    let mentionMember = member.map((v,k) => {
                        let z = tmp += v.length + 3;
                        let end = z + panjang;
                        let mentionz = `{"S":"${panjang}","E":"${end}","M":"${midnya}"}`;
                        return mentionz;
                    })
					mentionMemberx.push(mentionMember);
				}
			}
			const tag = {cmddata: { MENTION: `{"MENTIONEES":[${mentionMemberx}]}` }}
			seq.contentMetadata = tag.cmddata;
			this._client.sendMessage(0, seq);
	}
	
	mention(listMember) {
        let mentionStrings = [''];
        let mid = [''];
        mentionStrings.push('@'+listMember.displayName+'\n');
        mid.push(listMember.mid);
        let strings = mentionStrings.join('');
        let member = strings.split('@').slice(1);
        
        let tmp = 0;
        let memberStart = [];
        let mentionMember = member.map((v,k) => {
            let z = tmp += v.length + 1;
            let end = z - 1;
            memberStart.push(end);
            let mentionz = `{"S":"${(isNaN(memberStart[k - 1] + 1) ? 0 : memberStart[k - 1] + 1 ) }","E":"${end}","M":"${mid[k + 1]}"}`;
            return mentionz;
        })
        return {
            names: mentionStrings.slice(1),
            cmddata: { MENTION: `{"MENTIONEES":[${mentionMember}]}` }
        }
    }

    async recheck(cs,group) {
        let users;
        for (var i = 0; i < cs.length; i++) {
            if(cs[i].group == group) {
                users = cs[i].users;
            }
        }
        
        let contactMember = await this._getContacts(users);
        return contactMember.map((z) => {
                return { displayName: z.displayName, mid: z.mid };
            });
    }
	
	async leftGroupByName(payload) {
        let groupID = await this._getGroupsJoined();
	    for(var i = 0; i < groupID.length; i++){
		    let groups = await this._getGroups(groupID);
            for(var ix = 0; ix < groups.length; ix++){
                if(groups[ix].name == payload){
                    this._client.leaveGroup(0,groups[ix].id);
				    break;
                }
            }
	    }
    }

    removeReaderByGroup(groupID) {
        const groupIndex = this.checkReader.findIndex(v => {
            if(v.group == groupID) {
                return v
            }
        })

        if(groupIndex != -1) {
            this.checkReader.splice(groupIndex,1);
        }
    }

    async textMessage(textMessages, seq, param, lockt) {
        //const [ cmd, payload ] = textMessages.split(' ');
		const gTicket = textMessages.split('line://ti/g/');
		const linktxt = textMessages.split('http');
        const txt = textMessages.toLowerCase();
        const messageID = seq.id;
		const cot = textMessages.split('@');
		const com = textMessages.split(':');
		const cox = textMessages.split(' ');
		
		if(vx[1] == "sendcontact" && seq.from_ == vx[0] && waitMsg == "yes"){
			let panjang = txt.split("");
			if(txt == "cancel"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"# CANCELLED");
			}else if(txt == "me"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				seq.text = "Me";seq.contentType = 13;
				seq.contentMetadata = { mid: seq.from_ };
				this._client.sendMessage(0, seq);
			}else if(cot[1]){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				let ment = seq.contentMetadata.MENTION;
			    let xment = JSON.parse(ment);let pment = xment.MENTIONEES[0].M;
				seq.text = "Me";seq.contentType = 13;
				seq.contentMetadata = { mid: pment };
				this._client.sendMessage(0, seq);
			}else if(vx[2] == "arg1" && panjang.length > 30 && panjang[0] == "u"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				seq.text = "Me";seq.contentType = 13;
				seq.contentMetadata = { mid: txt };
				this._client.sendMessage(0, seq);
			}else{
				this._sendMessage(seq,"Tag orangnya atau kirim midnya !");
			}
		}
		if(txt == "sendcontact" && !isBanned(banList, seq.from_)){
			if(vx[2] == null || typeof vx[2] === "undefined" || !vx[2]){
			    waitMsg = "yes";
			    vx[0] = seq.from_;vx[1] = txt;vx[2] = "arg1";
			    this._sendMessage(seq,"Send Contact");
			}else{
				waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}
		}else if(txt == 'sendcontact' && isBanned(banList, seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(vx[1] == "addcontact" && seq.from_ == vx[0] && waitMsg == "yes"){
			let panjang = txt.split("");
			if(txt == "cancel"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"# Done");
			}else if(seq.contentType == 13){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				let midnya = seq.contentMetadata.mid;
				let listContacts = await this._client.getAllContactIds();
				for(var i = 0; i < listContacts.length; i++){
					if(listContacts[i] == midnya){
						vx[4] = "sudah";
						break;
					}
				}
				let bang = new Message();
				bang.to = seq.to;
				if(vx[4] == "sudah"){
					bang.text = "they are already in friend list !";
					this._client.sendMessage(0, bang);
				}else{
				    bang.text = "Adding Contact!";
				    await this._client.findAndAddContactsByMid(seq, midnya);
				    this._client.sendMessage(0, bang);
				}vx[4] = "";
			}else if(cot[1]){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				let ment = seq.contentMetadata.MENTION;
			    let xment = JSON.parse(ment);let pment = xment.MENTIONEES[0].M;let midnya = pment;
				let listContacts = await this._client.getAllContactIds();
				for(var i = 0; i < listContacts.length; i++){
					if(listContacts[i] == midnya){
						vx[4] = "sudah";
						break;
					}
				}
				let bang = new Message();
				bang.to = seq.to;
				if(vx[4] == "sudah"){
					bang.text = "they are already in friend list !";
					this._client.sendMessage(0, bang);
				}else{
				    bang.text = "Adding Contact!";
				    await this._client.findAndAddContactsByMid(seq, midnya);
				    this._client.sendMessage(0, bang);
				}vx[4] = "";
			}else if(vx[2] == "arg1" && panjang.length > 30 && panjang[0] == "u"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				let midnya = txt;
				let listContacts = await this._client.getAllContactIds();
				for(var i = 0; i < listContacts.length; i++){
					if(listContacts[i] == midnya){
						vx[4] = "sudah";
						break;
					}
				}
				let bang = new Message();
				bang.to = seq.to;
				if(vx[4] == "sudah"){
					bang.text = "they are already in friend list !";
					this._client.sendMessage(0, bang);
				}else{
				    bang.text = "Adding Contact!";
				    await this._client.findAndAddContactsByMid(seq, midnya);
				    this._client.sendMessage(0, bang);
				}vx[4] = "";
			}else{
				this._sendMessage(seq,"# How to !addcontact\n-Kirim Contact Orang Yang Mau Di Add\n-Kirim Mid Orang Yang Mau Di Add\n-Atau Tag Orang Yang Mau Di Add");
			}
		}
		if(txt == "addcontact" && isAdminOrBot(seq.from_)){
			if(vx[2] == null || typeof vx[2] === "undefined" || !vx[2]){
			    waitMsg = "yes";
			    vx[0] = seq.from_;vx[1] = txt;vx[2] = "arg1";
			    this._sendMessage(seq,"send contact or mid");
			}else{
				waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}
		}else if(txt == 'addcontact' && !isAdminOrBot(seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(vx[1] == "cekid" && seq.from_ == vx[0] && waitMsg == "yes"){
			let panjang = txt.split("");
			if(txt == "cancel"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"# CANCELLED");
			}else if(seq.contentType == 13){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				let midnya = seq.contentMetadata.mid;
				let bang = new Message();
				bang.to = seq.to;
				bang.text = midnya;
				this._client.sendMessage(0, bang);
			}else if(txt == "me"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				seq.text = seq.from_.toString();
				this._client.sendMessage(0, seq);
			}else if(cot[1]){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				let cekid = new Message();
				cekid.to = seq.to;
				let ment = seq.contentMetadata.MENTION;
			    let xment = JSON.parse(ment);let pment = xment.MENTIONEES[0].M;
				
				cekid.text = JSON.stringify(pment).replace(/"/g , "");
				this._client.sendMessage(0, cekid);
			}else{
				this._sendMessage(seq,"# How to !cekid\nTag orangnya / kirim kontak yang mau di-cek idnya !");
			}
		}
		if(txt == "cekid" && !isBanned(banList, seq.from_)){
			if(vx[2] == null || typeof vx[2] === "undefined" || !vx[2]){
			    waitMsg = "yes";
			    vx[0] = seq.from_;vx[1] = txt;vx[2] = "arg1";
			    this._sendMessage(seq,"Send Contact");
			}else{
				waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}
		}else if(txt == 'cekid' && isBanned(banList, seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(vx[1] == "kepo" && seq.from_ == vx[0] && waitMsg == "yes"){
			let panjang = txt.split("");
			if(txt == "cancel"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"# CANCELLED");
			}else if(seq.contentType == 13){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				let midnya = seq.contentMetadata.mid;
				let timeline_post = await this._getHome(midnya,config.chanToken);
				let bang = new Message();
				bang.to = seq.to;
				
				let orangnya = await this._getContacts([midnya]);
				let ress = timeline_post.result;
				bang.text = 
"\n#Nama: "+orangnya[0].displayName+"\n\
\n#ID: \n"+orangnya[0].mid+"\n\
\n#Profile Picture: \nhttp://dl.profile.line.naver.jp"+orangnya[0].picturePath+"\n\
\n#Cover Picture: \nhttp://dl.profile.line-cdn.net/myhome/c/download.nhn?userid="+orangnya[0].mid+"&oid="+ress.homeInfo.objectId+"\n\
\n#Status: \n"+orangnya[0].statusMessage+"\n\
\n\n\n \n\
====================\n\
              #Kepo \n\
====================";
				this._client.sendMessage(0,bang);
			}else if(cot[1]){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				let bang = new Message();
				bang.to = seq.to;
				let ment = seq.contentMetadata.MENTION;
			    let xment = JSON.parse(ment);let pment = xment.MENTIONEES[0].M;
				let timeline_post = await this._getHome(pment,config.chanToken);
				
				let orangnya = await this._getContacts([pment]);
				let ress = timeline_post.result;
				bang.text = 
"\n#Nama: "+orangnya[0].displayName+"\n\
\n#ID: \n"+orangnya[0].mid+"\n\
\n#Profile Picture: \nhttp://dl.profile.line.naver.jp"+orangnya[0].picturePath+"\n\
\n#Cover Picture: \nhttp://dl.profile.line-cdn.net/myhome/c/download.nhn?userid="+orangnya[0].mid+"&oid="+ress.homeInfo.objectId+"\n\
\n#Status: \n"+orangnya[0].statusMessage+"\n\
\n\n\n \n\
====================\n\
              #Kepo \n\
====================";
				this._client.sendMessage(0,bang);
			}else if(vx[2] == "arg1" && panjang.length > 30 && panjang[0] == "u"){
				let timeline_post = await this._getHome(txt,config.chanToken);
				let orangnya = await this._getContacts([txt]);
				let ress = timeline_post.result;
				seq.text = 
"\n#Nama: "+orangnya[0].displayName+"\n\
\n#ID: \n"+orangnya[0].mid+"\n\
\n#Profile Picture: \nhttp://dl.profile.line.naver.jp"+orangnya[0].picturePath+"\n\
\n#Cover Picture: \nhttp://dl.profile.line-cdn.net/myhome/c/download.nhn?userid="+orangnya[0].mid+"&oid="+ress.homeInfo.objectId+"\n\
\n#Status: \n"+orangnya[0].statusMessage+"\n\
\n\n\n \n\
====================\n\
              #Kepo \n\
====================";
vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,seq.text);
			}else{
				this._sendMessage(seq,"# How to kepo\nTag orangnya / kirim kontak / kirim mid yang mau dikepoin !");
			}
		}
		if(txt == "kepo" && !isBanned(banList, seq.from_)){
			if(vx[2] == null || typeof vx[2] === "undefined" || !vx[2]){
			    waitMsg = "yes";
			    vx[0] = seq.from_;vx[1] = txt;vx[2] = "arg1";
			    this._sendMessage(seq,"Send Mid");
			}else{
				waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}
		}else if(txt == 'kepo' && isBanned(banList, seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(vx[1] == "msg" && seq.from_ == vx[0] && waitMsg == "yes"){
			let panjang = txt.split("");
			if(txt == "cancel"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}else if(vx[2] == "arg1" && vx[3] == "mid" && cot[1]){
				let bang = new Message();bang.to = seq.to;
				bang.text = "Ok, Write your Message"
				this._client.sendMessage(0,bang);
				let ment = seq.contentMetadata.MENTION;
			    let xment = JSON.parse(ment);let pment = xment.MENTIONEES[0].M;
				let midnya = JSON.stringify(pment);
				vx[4] = midnya;
				vx[2] = "arg2";
			}else if(vx[2] == "arg1" && vx[3] == "mid" && seq.contentType == 13){
				let midnya = seq.contentMetadata.mid;let bang = new Message();bang.to = seq.to;
				bang.text = "Ok, Write your Message"
				this._client.sendMessage(0,bang);
				vx[4] = midnya;
				vx[2] = "arg2";
			}else if(vx[2] == "arg1" && vx[3] == "mid" && panjang.length > 30){
				this._sendMessage(seq,"Ok, Write your Message");
				vx[4] = txt;
				vx[2] = "arg2";
			}else if(vx[2] == "arg2" && vx[3] == "mid"){
				let panjangs = vx[4].split("");
				let kirim = new Message();let bang = new Message();
				bang.to = seq.to;
				if(panjangs[0] == "u"){
					kirim.toType = 0;
				}else if(panjangs[0] == "c"){
					kirim.toType = 2;
				}else if(panjangs[0] == "r"){
					kirim.toType = 1;
				}else{
					kirim.toType = 0;
				}
				bang.text = "Message Has been send";
				kirim.to = vx[4];
				kirim.text = txt;
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";vx[4] = "";
				this._client.sendMessage(0, kirim);
				this._client.sendMessage(0, bang);
			}else{
				this._sendMessage(seq,"# How to !msg\nTag / Kirim Kontak / Kirim Mid orang yang mau dikirimkan pesan !");
			}
		}if(txt == "msg" && !isBanned(banList, seq.from_)){
			if(vx[2] == null || typeof vx[2] === "undefined" || !vx[2]){
			    waitMsg = "yes";
			    vx[0] = seq.from_;vx[1] = txt;vx[3] = "mid";
			    this._sendMessage(seq,"Mau kirim pesan ke siapa ?");
				this._sendMessage(seq,"Tag / Send Contact / Kirim Mid orang yang mau dikirimkan pesan !");
				vx[2] = "arg1";
			}else{
				waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}
		}else if(txt == 'msg' && isBanned(banList, seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(vx[1] == "ban" && seq.from_ == vx[0] && waitMsg == "yes"){
			let panjang = txt.split("");
			if(txt == "cancel"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}else if(cot[1]){
				let ment = seq.contentMetadata.MENTION;
			    let xment = JSON.parse(ment);let pment = xment.MENTIONEES[0].M;
				let msg = new Message();msg.to = seq.to;
				if(isBanned(banList,pment)){
					waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
					msg.text = cot[1]+" sudah masuk daftar banlist...";
					this._client.sendMessage(0,msg);
				}else{
					msg.text = "Done!";
					this._client.sendMessage(0, msg);
			        banList.push(pment);
					waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				}
			}else if(seq.contentType == 13){
				let midnya = seq.contentMetadata.mid;let msg = new Message();msg.to = seq.to;
				if(isBanned(banList,midnya)){
					waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
					msg.text = "sudah masuk daftar banlist...";
					this._client.sendMessage(0, msg);
				}else{
					msg.text = "Done!";
					this._client.sendMessage(0, msg);
			        banList.push(midnya);
					waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				}
			}else if(panjang.length > 30 && panjang[0] == "u"){
				if(isBanned(banList,txt)){
					waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
					this._sendMessage(seq,"sudah masuk daftar banlist...");
				}else{
					let msg = new Message();msg.to = seq.to;msg.text = "Done!";
					this._client.sendMessage(0, msg);
			        banList.push(txt);
					waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				}
			}else{
					this._sendMessage(seq,"# How to ban\nKirim kontaknya / mid / tag orangnya yang mau diban sama abang !");
			}
		}
		if(txt == "ban" && isAdminOrBot(seq.from_)){
			if(vx[2] == null || typeof vx[2] === "undefined" || !vx[2]){
			    waitMsg = "yes";
			    vx[0] = seq.from_;vx[1] = txt;
			    this._sendMessage(seq,"Send Contact");
				vx[2] = "arg1";
				this._sendMessage(seq,"# Kirim kontaknya / mid / tag orangnya");
			}else{
				waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}
		}else if(txt == "ban" && !isAdminOrBot(seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(vx[1] == "unban" && seq.from_ == vx[0] && waitMsg == "yes"){
			let panjang = txt.split("");
			if(txt == "cancel"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}else if(cot[1]){
				let ment = seq.contentMetadata.MENTION;
			    let xment = JSON.parse(ment);let pment = xment.MENTIONEES[0].M;
				let bang = new Message();bang.to = seq.to;
				if(isBanned(banList, pment)){
					let ment = banList.indexOf(pment);
					if (ment > -1) {
                        banList.splice(ment, 1);
                    }
					waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
					bang.text = "Done!";
					this._client.sendMessage(0,bang);
				}else{
					bang.text = "User tidak masuk daftar";
					this._client.sendMessage(0, bang);
				}
			}else if(seq.contentType == 13){
				let midnya = seq.contentMetadata.mid;let bang = new Message();bang.to = seq.to;
				if(isBanned(banList, midnya)){
					let ment = banList.indexOf(midnya);
					if (ment > -1) {
                        banList.splice(ment, 1);
                    }
					waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
					bang.text = "Done!";
					this._client.sendMessage(0,bang);
				}else{
					bang.text = "User tidak masuk daftar";
					this._client.sendMessage(0, bang);
				}
			}else if(panjang.length > 30 && panjang[0] == "u"){
				let bang = new Message();bang.to = seq.to;
				if(isBanned(banList, txt)){
					let ment = banList.indexOf(txt);
					if (ment > -1) {
                        banList.splice(ment, 1);
                    }
					waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
					bang.text = "Done!";
					this._client.sendMessage(0,bang);
				}else{
					this._sendMessage(seq,"User tidak masuk daftar");
				}
			}else{
				this._sendMessage(seq,"# How to unban\nKirim kontaknya / mid / tag orangnya yang mau di-unban");
			}
		}
		if(txt == "unban" && isAdminOrBot(seq.from_)){
			if(vx[2] == null || typeof vx[2] === "undefined" || !vx[2]){
			    waitMsg = "yes";
			    vx[0] = seq.from_;vx[1] = txt;
				seq.text = "";
				for(var i = 0; i < banList.length; i++){
					let orangnya = await this._getContacts([banList[i]]);
				    seq.text += "\n-["+orangnya[0].mid+"]["+orangnya[0].displayName+"]";
				}
				this._sendMessage(seq,seq.text);
			    this._sendMessage(seq,"send contact");
				vx[2] = "arg1";
			}else{
				waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}
		}else if(txt == "unban" && !isAdminOrBot(seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(txt == "banlist"){
			seq.text = "[Mid] [Name]\n\n";
			for(var i = 0; i < banList.length; i++){
			    let orangnya = await this._getContacts([banList[i]]);
				seq.text += "["+orangnya[0].mid+"]["+orangnya[0].displayName+"]\n";
			}
			this._sendMessage(seq,seq.text);
		}
		
		if(txt == "leave" && isAdminOrBot(seq.from_)){
			this._client.leaveGroup(0,seq.to);
		}
		
		if(vx[1] == "youtube" && seq.from_ == vx[0] && waitMsg == "yes"){
			if(txt == "cancel"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}else if(vx[2] == "arg1" && linktxt[1]){
				vx[3] = '';vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";
				let dlUrl = "http"+linktxt[1];let tspl = textMessages.split("youtu.be/");
				if(tspl || typeof tspl !== "undefined"){
					dlUrl = "https://m.youtube.com/watch?v="+tspl[1];
				}
				let downloader = this.config.YT_DL;let hasil = '';
				let infDl = new Message();
				infDl.to = seq.to;
				var options = {
             	   uri: downloader,
             	   qs: {url: dlUrl},
            	   json: true // Automatically parses the JSON string in the response
            	};

            	await rp(options)
           	  	  .then(function (repos) {
           	          hasil = repos;
            	})
             	  .catch(function (err) {
                      console.info(err);
           	    });
				if(hasil == "Error: no_media_found"){
			    	infDl.text = "Gagal !, Url tidak ditemukan...";
				}else{
					let title = hasil.title;
					let urls = hasil.urls;
					infDl.text = "[ Youtube Downloader ]\nTitle: "+title+"\n";
					for(var i = 0; i < urls.length; i++){
						let idU = await this.gooGl(urls[i].id);
						infDl.text += "\n\
Info: "+urls[i].label+"\n\
Link Download: "+idU.id+"\n";
					}
				}
				this._sendMessage(seq,infDl.text);
			} else {
				this._sendMessage(seq,"# How to youtube\nKirim link youtubenya !");
			}
		}
		if(txt == "youtube" && !isBanned(seq.from_)){
			if(vx[2] == null || typeof vx[2] === "undefined" || !vx[2]){
				waitMsg = "yes";
			    vx[0] = seq.from_;vx[1] = txt;
			    this._sendMessage(seq,"Mau download youtube?, send linknya!");
				vx[2] = "arg1";
			}else{
				waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}
		}else if(txt == "youtube" && isBanned(seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(vx[1] == "botleave" && seq.from_ == vx[0] && waitMsg == "yes"){
			if(txt == "cancel"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}else if(txt == "group" && vx[2] == "arg1"){
				vx[3] = txt;
				this._sendMessage(seq,"Nama group?");
				vx[2] = "arg2";
			}else if(vx[3] == "group" && vx[2] == "arg2"){
				vx[0] = "";vx[1] = "";waitMsg = "no";vx[2] = "";vx[3] = "";
				this.leftGroupByName(textMessages);
			}
		}
		if(txt == "botleave" && isAdminOrBot(seq.from_)){
			if(vx[2] == null || typeof vx[2] === "undefined" || !vx[2]){
				waitMsg = "yes";
			    vx[0] = seq.from_;vx[1] = txt;
			    this._sendMessage(seq,"Nama group?");
				vx[2] = "arg1";
			}else{
				waitMsg = "no";vx[0] = "";vx[1] = "";vx[2] = "";vx[3] = "";
				this._sendMessage(seq,"#CANCELLED");
			}
		}else if(txt == "botleave" && !isAdminOrBot(seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(txt == "mute" && isAdminOrBot(seq.from_)){
			this.stateStatus.mute = 1;
			this._sendMessage(seq,"(*´﹃｀*)")
		}
		
        if(txt == 'cancel' && this.stateStatus.cancel == 1 && isAdminOrBot(seq.from_)) {
            this.cancelAll(seq.to);
        }else if(txt == "cancel" && !isAdminOrBot(seq.from_)){this._sendMessage(seq,"Not permitted !");}

        if(txt == 'halo') {
			let { mid, displayName } = await this._client.getProfile();
            this._sendMessage(seq, 'Halo juga '+displayName);
        }

		if(txt == "kick" && seq.toType == 2 && !isBanned(banList, seq.from_) && this.stateStatus.kick == 1){
			this._kickMember(seq.to,[seq.from_]);
		}else if(txt == 'kick' && isBanned(banList, seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
        if(txt == 'speed' && !isBanned(banList, seq.from_)) {
            const curTime = Math.floor(Date.now() / 1000);
            //this._sendMessage(seq,'processing....');
            const rtime = Math.floor(Date.now() / 1000) - curTime;
            this._sendMessage(seq, `${rtime} second`);
        }else if(txt == 'speed' && isBanned(banList, seq.from_)){this._sendMessage(seq,"Not permitted !");}

        /*if(txt === 'kernel') {
            exec('uname -a;ptime;id;whoami',(err, sto) => {
                this._sendMessage(seq, sto);
            })
        }*/

        if(txt === 'kickall' && this.stateStatus.kick == 1 && isAdminOrBot(seq.from_) && seq.toType == 2) {
            let { listMember } = await this.searchGroup(seq.to);
            for (var i = 0; i < listMember.length; i++) {
                if(!isAdminOrBot(listMember[i].mid)){
                    this._kickMember(seq.to,[listMember[i].mid])
                }
            }
        }else if(txt === 'kickall' && seq.toType == 2){this._sendMessage(seq,"Not permitted !");}
		
		if(txt == 'key' && !isAdminOrBot(seq.from_)) {
			let botOwner = await this._client.getContacts([myBot[0]]);
            let { mid, displayName } = await this._client.getProfile();
			let key2 = "\n\
====================\n\
| BotName   : "+displayName+"\n\
| BotID     : \n["+mid+"]\n\
| BotStatus : Working\n\
| BotOwner  : "+botOwner[0].displayName+"\n\
====================\n";
			seq.text = key2 += this.keyhelp;
			this._client.sendMessage(0, seq);
		}
		
		if(txt == '0101') {//Jangan dicoba (gk ada efek)
            let { listMember } = await this.searchGroup(seq.to);
            for (var i = 0; i < listMember.length; i++) {
                if(listMember[i].mid==param){
					let namanya = listMember[i].dn;
					seq.text = 'Halo @'+namanya+', Selamat datang bro ! Salam Kenal ^_^';
					let midnya = listMember[i].mid;
					let kata = seq.text.split("@").slice(0,1);
					let kata2 = kata[0].split("");
					let panjang = kata2.length;
                    let member = [namanya];
        
                    let tmp = 0;
                    let mentionMember = member.map((v,k) => {
                        let z = tmp += v.length + 1;
                        let end = z + panjang;
                        let mentionz = `{"S":"${panjang}","E":"${end}","M":"${midnya}"}`;
                        return mentionz;
                    })
					const tag = {cmddata: { MENTION: `{"MENTIONEES":[${mentionMember}]}` }}
					seq.contentMetadata = tag.cmddata;
					this._client.sendMessage(0, seq);
					//console.info("Salam");
                }
            }
        }
		
		if(txt == "tagall" && !isAdminOrBot(seq.from_) && seq.toType == 2 && !isBanned(banList, seq.from_)){
			await this.tagAlls(seq);
		}else if(txt == 'tagall' && isBanned(banList, seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(txt == '0103' && lockt == 1){
			let ax = await this._client.getGroup(seq.to);
			if(ax.preventJoinByTicket === true){}else{ax.preventJoinByTicket = true;await this._client.updateGroup(0, ax);}
		}
		if(txt == '0104' && lockt == 1){
			let ax = await this._client.getGroup(seq.to);
			if(ax.preventJoinByTicket === true){ax.preventJoinByTicket = false;await this._client.updateGroup(0, ax);}else{}
		}
		
		if(txt == '0102' && lockt == 1) {//Jangan dicoba (gk ada efek)
            let { listMember } = await this.searchGroup(seq.to);
            for (var i = 0; i < listMember.length; i++) {
                if(listMember[i].mid==param){
					let namanya = listMember[i].dn;
					seq.text = 'Goodbye ! @'+namanya;
					let midnya = listMember[i].mid;
					let kata = seq.text.split("@").slice(0,1);
					let kata2 = kata[0].split("");
					let panjang = kata2.length;
                    let member = [namanya];
        
                    let tmp = 0;
                    let mentionMember = member.map((v,k) => {
                        let z = tmp += v.length + 1;
                        let end = z + panjang;
                        let mentionz = `{"S":"${panjang}","E":"${end}","M":"${midnya}"}`;
                        return mentionz;
                    })
					const tag = {cmddata: { MENTION: `{"MENTIONEES":[${mentionMember}]}` }}
					seq.contentMetadata = tag.cmddata;
					this._client.sendMessage(0, seq);
					//console.info("Salam");
                }
            }
        }

        /*if(txt == 'setpoint') {
            this._sendMessage(seq, `Setpoint for check reader.`);
            this.removeReaderByGroup(seq.to);
        }*/

        /*if(txt == 'clear') {
            this.checkReader = []
            this._sendMessage(seq, `Remove all check reader on memory`);
        }  */

        /*if(txt == 'recheck'){
            let rec = await this.recheck(this.checkReader,seq.to);
            const mentions = await this.mention(rec);
            seq.contentMetadata = mentions.cmddata;
            await this._sendMessage(seq,mentions.names.join(''));
            
        }*/

        /*if(txt == 'setpoint for check reader .') {
            this.searchReader(seq);
        }*/

        /*if(txt == 'clearall') {
            this.checkReader = [];
        }*/
		
		if(txt == "kickban" && isAdminOrBot(seq.from_)){
			for(var i = 0; i < banList.length; i++){
				let adaGk = await this.isInGroup(seq.to, banList[i]);
				if(typeof adaGk !== "undefined" && adaGk){
					this._kickMember(seq.to,adaGk);
				}
			}
		}else if(txt == "kickban" && !isAdminOrBot(seq.from_)){this._sendMessage(seq,"Not permitted !");}
		
		if(txt == "setting"){
			this.setState(seq,1)
		}
		
        const action = ['cancel on','cancel off','kick on','kick off','salam on','salam off','protect off','protect on','qr on','qr off']
        if(action.includes(txt)) {
            this.setState(seq,0)
        }
	
        if(txt == 'myid' /*|| txt == 'mid' || txt == 'id'*/) {
            this._sendMessage(seq,"ID Kamu: "+seq.from_);
        }

       /* if(txt == 'speedtest' && isAdminOrBot(seq.from)) {
            exec('speedtest-cli --server 6581',(err, res) => {
                    this._sendMessage(seq,res)
            })
        }*/
		
		if(txt == 'ginfo' && !isAdminOrBot(seq.from_) && !isBanned(banList, seq.from_)) {
            let groupInfo = await this._client.getGroup(seq.to);let gqr = 'open';
			let createdT64 = groupInfo.createdTime.toString().split(" ");
			let createdTime = await this._getServerTime(createdT64[0]);
			let gid = seq.to;
			let gname = groupInfo.name;
			let memberCount = groupInfo.members.length;
			let gcreator = groupInfo.creator.displayName;
			let pendingCount = 0;
			if(groupInfo.invitee !== null){
				pendingCount = groupInfo.invitee.length;
			}
			let gcover = groupInfo.pictureStatus;
			let qr = groupInfo.preventJoinByTicket;
			if(qr === true){
				gqr = 'close';
			}
			let bang = new Message();
			bang.to = seq.to;
			
			bang.text = "# Group Name:\n"+gname+"\n\
\n# Group ID:\n"+gid+"\n\
\n# Group Creator:\n"+gcreator+"\n\
\n# Group CreatedTime:\n"+createdTime+"\n\
\n# Member: "+memberCount+"\n\
\n# Pending: "+pendingCount+"\n\
\n# QR: "+gqr+"\n\
\n# Group Cover:\nhttp://dl.profile.line.naver.jp/"+gcover;
            this._client.sendMessage(0,bang);
        }else if(txt == 'ginfo' && isBanned(banList, seq.from_)){this._sendMessage(seq,"Not permitted !");}

        const joinByUrl = ['gurl'];
        if(joinByUrl.includes(txt)) {
            this._sendMessage(seq,`Updating group ...`);
            let updateGroup = await this._getGroup(seq.to);
            if(updateGroup.preventJoinByTicket === true) {
                updateGroup.preventJoinByTicket = false;
				await this._updateGroup(updateGroup);
            }
			const groupUrl = await this._reissueGroupTicket(seq.to)
            this._sendMessage(seq,`Line group = line://ti/g/${groupUrl}`);
        }
		
		if(txt == "0105" && lockt == 1){
			let aas = new Message();
			aas.to = param;
			let updateGroup = await this._getGroup(seq.to);
            if(updateGroup.preventJoinByTicket === true) {
                updateGroup.preventJoinByTicket = false;
				await this._updateGroup(updateGroup);
            }
			const groupUrl = await this._reissueGroupTicket(seq.to);
			aas.toType = 0;
			aas.text = `!joinline://ti/g/${groupUrl}`;
			this._client.sendMessage(0, aas);
		}
		
		if(txt == "0106" && lockt == 1){
			let friend = await this.isItFriend(param);
			if(friend == "no"){
				await this._client.findAndAddContactsByMid(0, param);
				this._client.inviteIntoGroup(0,seq.to,[param]);
			}else{this._client.inviteIntoGroup(0,seq.to,[param]);}
		}
		
		if(gTicket[0] == "join" && isAdminOrBot(seq.from_)){
			let sudah = "no";
			let grp = await this._client.findGroupByTicket(gTicket[1]);
			let lGroup = await this._client.getGroupIdsJoined();
			for(var i = 0; i < lGroup.length; i++){
				if(grp.id == lGroup[i]){
					sudah = "ya";
				}
			}
			if(sudah == "ya"){
				let bang = new Message();bang.to = seq.to;bang.text = "Gagal join, sudah di group";
				this._client.sendMessage(0,bang);
			}else if(sudah == "no"){
				await this._acceptGroupInvitationByTicket(grp.id,gTicket[1]);
			}
		}

        /*if(cmd === 'ip') {
            exec(`curl ipinfo.io/${payload}`,(err, res) => {
                const result = JSON.parse(res);
                if(typeof result.error == 'undefined') {
                    const { org, country, loc, city, region } = result;
                    try {
                        const [latitude, longitude ] = loc.split(',');
                        let location = new Location();
                        Object.assign(location,{ 
                            title: `Location:`,
                            address: `${org} ${city} [ ${region} ]\n${payload}`,
                            latitude: latitude,
                            longitude: longitude,
                            phone: null 
                        })
                        const Obj = { 
                            text: 'Location',
                            location : location,
                            contentType: 0,
                        }
                        Object.assign(seq,Obj)
                        this._sendMessage(seq,'Location');
                    } catch (err) {
                        this._sendMessage(seq,'Not Found');
                    }
                } else {
                    this._sendMessage(seq,'Location Not Found , Maybe di dalem goa');
                }
            })
        }*/
    }

}

module.exports = new LINE();
