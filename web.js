var http = require("http");
var CPU = require("./computer.js").CPU(128);
var cmnds = [];
var MAXNUM = CPU.getMAXNUM();
var MINNUM = CPU.getMINNUM();
var ISET = CPU.getInstructionSet();

function cmndQueueGen(){
    var q = [];
    function getQueue(){
        return q;
    }
    function push(x){
        var i = q.length;
        while(i > 0){
            q[i]=q[i-1];
            i-=1;
        }
        q[i]=x;
    }
    function get(i){
        if(i>-1 && i<q.length){
            return q[i];
        } else {
            return null;
        }
    }
    function pop(){
        var tmp  = q.pop();
        var arr  = tmp.split("_");
        var cmnd = arr[0];
        var arg  = null;
        if(arr.length===2){
            arg = arr[1];
        }
        return [cmnd,arg];
    }
    function clear(){
        q = [];
    }
    function size(){
        return q.length;
    }
    return {"push":push,"pop":pop,"clear":clear,"size":size,"get":get};
}

var cmndQueue = cmndQueueGen();

function appendStyle(res){
    res.write(`<style>
    input[type='text']{
        width:200px;
        height:30px;
    }
    input[type='button']{
        border:none;
        color:white;
        height:30px;
        padding-left:20px;
        padding-right:20px;
    }
    .blue{
        background-color:blue;
    }
    .green{
        background-color:green;
    }
    select{
        height:30px;
        width:200px;
    }
    td{
        border:1px solid black;
        background-color:orange;
        padding-left:10px;
        padding-right:10px;
    }
    .memory{
        left:100px;
        top:30px;
        background-color:bisque;
        display:none;
    }
    </style>`);
}

function appendScript(res){
    res.write(`<script>
function lstChng(){
    var sel = document.querySelector("select");
    var inp = document.querySelector('.cmnd');
    if(sel.value !== "") {
        inp.value=sel.value+" <arg>";
    }
}

function dispMem(){
    var mem = document.querySelector(".memory");
    mem.style.display = "block";
}

function hideMem(){
    var mem = document.querySelector(".memory");
    mem.style.display = "none";
}

function doSubmit(){
var frm = document.querySelector('form');
var inp = document.querySelector('.cmnd');
var cmnd = String(inp.value).trim().replace(' ','_');
frm.setAttribute('action',"do_"+cmnd);
frm.submit();
}

function doAppend(){
var frm = document.querySelector('form');
var inp = document.querySelector('.cmnd');
var cmnd = String(inp.value).trim().replace(' ','_');
frm.setAttribute('action',"append_"+cmnd);
frm.submit();
}
</script>`);
}

function createMemory(res){
    var prefG = "<font size='1' color='green'>";
    var prefB = prefG.replace('green','blue');
    res.write("<div class='memory'>");
    res.write('<input type="button" class="blue" value="hide" onclick="hideMem()">');
    res.write("<table>");
    var tmp = CPU.getRegVal("A");
    for(var i=0;i<CPU.getMemSize();i++){
        CPU.run("SETA",i);
        res.write("<tr><td>"+prefB+i+").</font></td><td>"+prefG+CPU.getMem()+"</font></td></tr>");
    }
    res.write("</table></div>");
    CPU.run("SETA",tmp);
}

function appendCmndList(res){
    res.write("<select onchange='lstChng()'>");
    res.write("<option value=''>--help--</option>");
    for(var i=0;i<ISET.length;i++){
        res.write("<option value='"+ISET[i]+"'>"+ISET[i]+"</option>");
    }
    res.write("</select>");
    res.write('<input type="button" class="blue" value="Show Memory" onclick="dispMem()">');
}

function appendForm(res){
    res.write("<form method='POST'>");
    res.write("<input type='text' class='cmnd'>");
    res.write("<input type='button' class='green' value='run' onclick='doSubmit()'>");
    res.write("<input type='button' class='blue' value='append' onclick='doAppend()'>");
    res.write("</form>");
}

function appendCodeQueue(res){
    var G = 'green';
    var B = 'blue';
    var preG  = "<br><font ";
    preG += "color='green' ";
    preG += "size='2'>";
    var preB=preG.replace(G,B);
    var qSize = cmndQueue.size();
    var cap = "Codes waiting to run:";

    if(qSize > 0){
        res.write(preB+cap+"</font>");
        var cnt = 0;
        for(var i=qSize-1;i>=0;i--){
            cnt+=1;
            var d=cnt+").";
            d+=cmndQueue.get(i);
            d=d.replace("_"," ");
            res.write(preG+d+"</font>");
        }
    }
}

function writeRegisterTable(res){
    res.write("<table>");

    res.write("<tr>");
    res.write("<td>A</td>");
    res.write("<td>B</td>");
    res.write("<td>C</td>");
    res.write("<td>D</td>");
    res.write("<td>ov</td>");
    res.write("</tr>");

    res.write("<tr>");
    res.write("<td>"+CPU.getRegVal("A")+"</td>");
    res.write("<td>"+CPU.getRegVal("B")+"</td>");
    res.write("<td>"+CPU.getRegVal("C")+"</td>");
    res.write("<td>"+CPU.getRegVal("D")+"</td>");
    res.write("<td>"+CPU.getRegVal("OV")+"</td>");
    res.write("</tr>");

    res.write("</table>");
}

function initRespBody(res){
    res.writeHead(200,{'Content-Type':'text/html'});
    res.write("<meta name='viewport' content='width=device-width, initial-scale=1.0'>\n<html>\n<head>\n");
    appendStyle(res);
    appendScript(res);
    res.write("</head><body>");
    appendCmndList(res);
    appendForm(res);
}

function endRespBody(res){
    res.write("</body></html>");
    res.end();
}

function history(cArr,res){
    writeRegisterTable(res);
    var cmnd;
    for(var i=0;i<cArr.length;i++){
        cmnd = cArr[i];
        if(cmnd !== ""){
            cmnds.push(cmnd);
        }
    }
    var clen = cmnds.length;
    if(clen>0){
        for(var i=clen-1;i>=0;i--){
            res.write("<font size='1'>"+i+".) "+cmnds[i]+"</font>");
        }
    }
}

function run(cmnd,arg,res){
    var rsltArr = [];
    var rslt;
    while(cmndQueue.size() > 0){
        var c = cmndQueue.pop();
        rslt  = runCmnd(c[0],c[1]);
        rsltArr.push(rslt);
    }
    if(cmnd !== "") {
        rslt = runCmnd(cmnd,arg);
        rsltArr.push(rslt);
    }
    history(rsltArr,res);
}

function runCmnd(cmnd,arg){
    var r = CPU.run(cmnd,arg);
    var rslt = "["+cmnd+" "+arg+"] ";
    rslt+="<font color='red'>"+r.err+"</font>";
    rslt+="<font color='green'>"+r.msg+"</font>";
    rslt+="<br>";
    return rslt;
}

var server = http.createServer((req,res)=>{
    var url    = String(req.url);
    var APPURL = "/append_";
    var DOURL  = "/do_";
    initRespBody(res);
    if(url.indexOf(APPURL)>-1){
        var raw=url.replace(APPURL,"");
        if(raw.trim()!=="") {
        cmndQueue.push(raw.toUpperCase());
        }
        appendCodeQueue(res);
    } else if(url.indexOf(DOURL)>-1){
        var raw=url.replace(DOURL,"");
        if(raw.trim() === "") {
            run("",arg,res);
        } else {
            var cmndSpl=raw.split("_");
            var cmnd = cmndSpl[0];
            var arg  = null;
            if(cmndSpl.length == 2){
                arg  = cmndSpl[1];
            }
            run(cmnd.toUpperCase(),arg,res);
        }
    }
    createMemory(res);
    endRespBody(res);
});

server.listen(8888);
