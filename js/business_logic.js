$(document).ready(function() {
	$("#signature").jSignature({color:"#145394"})
})

function importImg(sig)
{
	sig.children("img.imported").remove();
	$("<img class='imported'></img").attr("src",sig.jSignature('getData')).appendTo(sig);
}
