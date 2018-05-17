function Memory(SIZE){
    mem = [];
    for(var i=0;i<SIZE;i++){
        mem.push(0);
    }
    function size(){
        return mem.length;
    }
    function getData(addr){
        if(addr>=0 && addr<SIZE){
            return mem[addr];
        } else {
            return null;
        }
    }
    function setData(addr,data){
        if(addr>=0 && addr<SIZE){
            mem[addr]=data;
        }
    }
    return {"size":size,"getData":getData,"setData":setData};
}

function CPU(SIZE){
    if(isNaN(SIZE)){
        return;
    }
    var MAXNUM = SIZE - 1;
    var MINNUM = -1 * SIZE;
    var A   = 0;
    var B   = 0;
    var C   = 0;
    var D   = 0;
    var ov  = 0;
    var tmp = 0;
    var RAM = new Memory(SIZE);
    
    function reset(){
        ov=0;
    }
    function getProper(x){
        reset();
        if(x>MAXNUM){
            x=MAXNUM;
            ov=1;
        } else if(x<MINNUM){
            x=0;
            ov=1;
        }
        return x;
    }
    function getA(){return A;}
    function getB(){return B;}
    function getC(){return C;}
    function getD(){return D;}
    function getOv(){return ov;}
    function setA(x){A=getProper(x);}
    function setB(x){B=getProper(x);}
    function setC(x){C=getProper(x);}
    function setD(x){D=getProper(x);}
    function addA(x){tmp=A+x;setA(tmp);}
    function subA(x){tmp=A-x;setA(tmp);}
    function mulA(x){tmp=A*x;setA(tmp);}
    function divA(x){tmp=A/x;setA(tmp);}
    function shiftLA(x){tmp=A<<x;setA(tmp);}
    function shiftRA(x){tmp=A>>x;setA(tmp);}
    function memSet(data){
        RAM.setData(A,data);
    }
    function memGet(){
        return RAM.getData(A);
    }
    function getMemSize(){
        return RAM.size();
    }
    function getMAXNUM(){return MAXNUM;}
    function getMINNUM(){return MINNUM;}

    var INSTSET = {"ADDA":addA,"SUBA":subA,
                   "MULA":mulA,"DIVA":divA,
                   "SETA":setA,"SETB":setB,
                   "SETC":setC,"SETD":setD,
                   "LFTA":shiftLA,"RHTA":shiftRA
,
"SETMEM":memSet
                   };

    var REG = {"A":getA,"B":getB,"C":getC,"D":getD,"OV":getOv};

    function getInstructionSet() {
        var lst = [];
        for(c in INSTSET) {
            lst.push(c);
        }
        return lst;
    }

    function getRegVal(regName) {
        regName = regName.toUpperCase();
        return REG[regName]();
    }

    function run(f,arg) {
        f = f.toUpperCase();
        if(f in INSTSET) {
            if(isNaN(arg)){
                arg = getRegVal(arg);
                if(arg === undefined) {
                    return {err:"arg passed is neither a number nor a register",msg:""};
                }
            }
            INSTSET[f](parseInt(arg));
            return {err:"",msg:"success"};
        }  else {
            return {err:"code not in instruction set.",msg:""};
        }
    }

    return {"run":run,"getInstructionSet":getInstructionSet,"getRegVal":getRegVal,"getMemSize":getMemSize,"getMem":memGet,"getMAXNUM":getMAXNUM,"getMINNUM":getMINNUM};
}


module.exports = {"CPU":CPU};
