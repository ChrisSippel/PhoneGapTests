var selectedDate;
var SEPARATOR = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';
var calendarStart = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0'
    ].join(SEPARATOR);
    var calendarEnd = SEPARATOR + 'END:VCALENDAR';

$(document).ready(function() {
    // page is now ready, initialize the calendar...
    $('#calendar').fullCalendar({
        // put your options and callbacks here
        weekends:false,
        columnFormat:"dddd",
        fixedWeekCount: false,
        theme: true,
        unselectAuto: false,
        dayClick: function(date, jsEvent, view) {
           $('#calendar').fullCalendar( 'select', date )
           
           
           var dayHasEvent = false;
           $('#calendar').fullCalendar('clientEvents', function(event) {
                if(event.start.toISOString() == date.toISOString()) {
                    dayHasEvent = true;
                    return;                  
                }
            });
            
            if (dayHasEvent){
                disableReserveButton();
                selectedDate = null;
            }
            else{
                selectedDate = date;
                enableReserveButton();
            }
        },
        customButtons: {
            reserveButton: {
                text: 'Reserve',
                click: function() {
                    if (selectedDate == null){
                        return;
                    }
                    
                    var myDate = selectedDate._d.toISOString().substr(0,10)+"T12:00:00";

                    post('http://40.117.235.80:3000/reserveday', {datetime: myDate});
                    window.location.href=window.location.href; 
                }
            }
        },
        header: {
            left: 'reserveButton',
            center: 'title',
            right: 'today,prev,next'
        },
        unselect:function(view, jsEvent)
        {
            selectedDate = null;
        },
        viewRender:function(view, element)
        {
            reloadWebpage();
        }
    })

});

function reloadWebpage()
{
    httpGetAsync("http://40.117.235.80:3000/reserveddays", function(response)
    {
        var reservedDate = JSON.parse( response );
        if(reservedDate == null){
            return;
        }
        for(var i=0; i<reservedDate.docs.length; i++){
            var event={id:i , title: 'Reserved', start:  new Date(reservedDate.docs[i].datetime), allDay: true};
            $('#calendar').fullCalendar( 'renderEvent', event );  
        }
    });
}

function httpGetAsync(theUrl, callback)
{
    $.get(theUrl, callback);
}

function post(path, params, method) {
    method = method || "post"; 
    
    $.post(path, params, function(responseText){
        var response = JSON.parse( responseText );
        if (response.status == 200){
            var dateTime = response.datetime;
            var startDateTime = dateTime.replace("T12:00:00", "T09:00:00");
            var endDateTime = dateTime.replace("T12:00:00", "T09:30:00");
            var icsContent = createIcsContent(startDateTime, endDateTime);
            downloadIcs(icsContent);
        }
    });
}

function disableReserveButton(){
    var leftDiv = document.getElementsByClassName("fc-left");
    if (leftDiv.length != 1) {
        return
    }
    
    var reserveButton = leftDiv[0].children[0];
    reserveButton.className += " fc-state-disabled";
    reserveButton.disabled = true;
    reserveButton.style.cursor = "default";
}

function enableReserveButton(){
    var leftDiv = document.getElementsByClassName("fc-left");
    if (leftDiv.length != 1) {
        return
    }
    
    var reserveButton = leftDiv[0].children[0];
    reserveButton.className = reserveButton.className.replace(" fc-state-disabled", "");
    reserveButton.disabled = false;
    reserveButton.style.cursor = "pointer";
}

function createIcsContent(startDateTime, endDateTime){
    var calendarEvent = [
                'BEGIN:VEVENT',
                'CLASS:PUBLIC',
                'DESCRIPTION:' + "Article of the day",
                'DTSTART;VALUE=DATE:' + startDateTime,
                'DTEND;VALUE=DATE:' + endDateTime,
                'LOCATION:' + "Magnet Forensics",
                'SUMMARY;LANGUAGE=en-us:' + "Article of the day",
                'TRANSP:TRANSPARENT',
                'END:VEVENT'
            ].join(SEPARATOR);
            
    return calendarEvent;
}

function downloadIcs(icsContent){
    var calendar = calendarStart + SEPARATOR + icsContent + calendarEnd;

    var blob;
    if (navigator.userAgent.indexOf('MSIE 10') === -1) { // chrome or firefox
        blob = new Blob([calendar]);
    } 
    else { // ie
        var bb = new BlobBuilder();
        bb.append(calendar);
        blob = bb.getBlob('text/x-vCalendar;charset=' + document.characterSet);
    }
    saveAs(blob, "AotD.ics");
    return calendar;
}