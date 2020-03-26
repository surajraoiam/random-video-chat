$(document).ready(function() {
	log_in = localStorage.getItem("log-in");
	if(null != log_in){
		if(log_in == "true"){
			localStorage.setItem("log-in", false); 
		}
	}
	$('#action_menu_btn').click(function() {
		$('.action_menu').toggle();
	});
	$('#log-out').click(function() {
		localStorage.setItem("log-out", true);
		window.location.href="registration.html";
	});
	
	
});