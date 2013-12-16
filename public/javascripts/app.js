$(function(){
  $('.toggle_status').on('click',function(e){
    e.preventDefault();
    $.ajax({
      type:'POST',
      url: '/toggle_status'
    }).done(function(status){
      var html = (status.on) ? ' On' : 'Off';
      $('.status span').html(html);
      $('.toggle_status').html('Turn '+ ( (!status.on) ? 'On' : 'Off' ));
    })
  });

  if (typeof accounts !== 'undefined') {
    var options = '';
    for (var i = 0; i < accounts.items.length; i++) {
      var account = accounts.items[i];
      options += '<option value="'+account.id+'|'+account.name+'">'+account.name+'</option>';
    }
    $('#accounts').append(options);

    $('#accounts').on('change', function(){
      var id = $(this).val().split('|');
      $.ajax({
        url: '/list_properties/'+id[0],
      }).done(function(data){
        var profileOptions = '';
        for (var i = 0; i  < data.items.length; i++ ){
          var profile = data.items[i];
          profileOptions += '<option value="'+profile.internalWebPropertyId+'|'+profile.name+'">'+profile.name+'</option>';
        }
        $('#profile').html(profileOptions);
      });
    });
  }
});