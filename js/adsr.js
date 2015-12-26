var canvas      = document.getElementById('adsr-graph'),
    drawCtx     = canvas.getContext('2d'),
    height      = canvas.height,
    width       = canvas.width,
    audioCur    = new Float32Array(1);
$(document).ready(function(){
    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    });
    $("#playSound, #sound-warn").hide();
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    $("#loader").hide().removeClass('hidden');
    updateDraw(drawCtx);
    $.each($('#env-ctrl input, #env-tns input'), function(){
        updateValues(this);
    });
    $('#env-ctrl input, #env-tns input').on('input', function(){
        $("#playSound").hide();
        updateValues(this);
        updateDraw(drawCtx);
    });
    $('#getCurve').click(function(){
        warning=$('input[name=show-warn]').prop('checked');
        res=parseInt($('input[name=resolution]').val());
        go=true;
        if(warning)
            go = confirm('Calcualtion the curve can be quite CPU intensive.\nAre you sure you wish to continue?\nps: you can disable this message in the options');
        if(go)
            showLoader(drawCtx,res);
    });
    $("#output").on('click', function(){
        SelectText("output");
    });
    $(".switchy").bootstrapSwitch();
    if($('input[name="changeName"]').bootstrapSwitch('state'))
        $("#name-wrap").removeClass('hidden');
    $('input[name="changeName"]').on('switchChange.bootstrapSwitch', function(event, state) {
        if(state)
            $("#name-wrap").hide().removeClass('hidden').fadeIn();
        else
            $("#name-wrap").fadeOut();
    });
    $("#playSound").click(function(){
        playSound(audioCtx);
    })
});
function updateValues(that){
    val = $(that).val();
    $(that).siblings('.the-val').html(val);
}
function updateDraw(ctx){
    delay=parseInt($('input[name=delay]').val());
    attack=parseInt($('input[name=attack]').val());
    attackSlope=parseFloat($('input[name=attack-slp]').val());
    hold=parseInt($('input[name=hold]').val());
    decay=parseInt($('input[name=decay]').val());
    decaySlope=parseFloat($('input[name=decay-slp]').val());
    sustain=parseInt($('input[name=sustain]').val());
    decayVal=1-parseFloat($('input[name=sustain-slp]').val());
    release=parseInt($('input[name=release]').val());
    releaseSlope=parseFloat($('input[name=release-slp]').val());
    decPointFix=Math.floor(decayVal*(1-decaySlope)*height);
    relPointFix=Math.floor((1-decayVal)*height*(1-releaseSlope)+(decayVal*height));
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle="black";
    ctx.beginPath();
    ctx.moveTo(delay,height);
    ctx.quadraticCurveTo(delay+attack*attackSlope, height*attackSlope, delay+attack,0);
    ctx.stroke();
    var path = new Path2D();
    path.moveTo(delay+attack,0);
    path.lineTo(delay+attack+hold,0);
    ctx.stroke(path);
    ctx.beginPath();
    ctx.moveTo(delay+attack+hold,0);
    ctx.quadraticCurveTo(delay+attack+decay*decaySlope+hold, decPointFix, delay+attack+hold+decay,decayVal*height);
    ctx.stroke();
    var path = new Path2D();
    path.moveTo(delay+attack+hold+decay,decayVal*height);
    path.lineTo(delay+attack+hold+decay+sustain,decayVal*height);
    ctx.stroke(path);
    ctx.moveTo(delay+attack+hold+decay+sustain,decayVal*height);
    ctx.quadraticCurveTo(delay+attack+hold+decay+sustain+release*releaseSlope,relPointFix, delay+attack+hold+decay+sustain+release,height);
    ctx.stroke();
}
function showLoader(ctx,res){
    $("#loader").fadeIn();
    setTimeout(function(){getCurve(ctx,res);},300);
}

function getCurve(ctx,res){
    drawPoints = $('input[name=show-points]').prop('checked');
    drawActual = $('input[name=draw-real]').prop('checked');
    updateDraw(drawCtx);
    step = Math.floor(width/res);
    curve = new Float32Array(res);
    if(drawActual){
        var path = new Path2D(),
            firstPoint = true;
    }
    n=0;
    for(i=0;i<width;i+=step){
        for(j=0;j<=height;j++){
            if(ctx.getImageData(i, j, 1, 1).data[3]!=0){
                curve[n] = (height-j)/height;
                if(drawPoints){
                    ctx.fillStyle="#FF0000";
                    ctx.fillRect(i-2,j-2,5,5);
                    //ctx.fillText("Hello World!",i+2,j);
                }
                if(drawActual){
                    if(firstPoint){
                        path.moveTo(i,j);
                        firstPoint=false;
                    }
                    else{
                        path.lineTo(i,j);
                    }

                }
                break;
            }
            if(drawPoints){
                ctx.fillStyle="#FFB7B7";
                ctx.fillRect(i,j,1,1);
            }

            if(j==height){
                curve[n] = 0;
            }
        }
        n++;
        if(drawActual){
            ctx.strokeStyle="#00FF00";
            ctx.stroke(path);
        }
    }
    $("#loader").fadeOut();
    outputCurve(curve);
}
function outputCurve(curve){
    name = "curve";
    if($('input[name="changeName"]').bootstrapSwitch('state'))
        name = $('input[name=curve-name]').val();
    size = curve.length;
    audioCur = new Float32Array(size);
    str = "";
    str+=name+ " = new Float32Array("+size+");\n"
    for(i=0;i<size;i++){
        str+="\t"+name+"["+i+"] = "+curve[i]+";\n"
        audioCur[i] = curve[i];
    }
    $("#output").html(str).removeClass("hidden");
    $("#playSound, #sound-warn").fadeIn();

}

function SelectText(element) {
    var doc = document
        , text = doc.getElementById(element)
        , range, selection
    ;    
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();        
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function playSound(ctx){
    var now = ctx.currentTime;
    osc = ctx.createOscillator();
    osc.type = "square"
    osc.frequency.value = 220;
    amp = ctx.createGain();
    osc.connect(amp);
    amp.connect(ctx.destination);
    amp.gain.value = 0;
    amp.gain.setValueCurveAtTime(audioCur, ctx.currentTime, 2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime+2);
}
