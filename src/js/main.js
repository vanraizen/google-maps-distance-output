$(document).ready(function() {
    var mapper = new Mapper($('#outputElement'), $('#unprocessableLocations'));
    mapper.run();
});

/**
 * This is the object that will handle calling out to the Google Maps API and handling the response
 * You can change the initial data list by altering this.initialData
 * Change this.startingAddress to change origin
 *
 * @param $outputElement JQuery reference to output (Must be table!)
 * @param $unprocessableLocations JQuery reference to dump locations in which Google Maps failed to parse (Must be list!)
 * @constructor
 */
function Mapper($outputElement, $unprocessableLocations) {

    var DEBUG = false;
    var that = this;
    this.startingAddress = '510 Victoria, Venice, CA';
    this.$outputElement = $outputElement;
    this.$unprocessableLocations = $unprocessableLocations;
    this.initialData = [
        'Times Square, Manhattan, NY 10036',
        '13000 S Dakota 244, Keystone, SD 57751',
        '1600 Pennsylvania Ave NW, Washington, DC 20500',
        'Golden Gate Bridge, San Francisco, CA 94129',
        'Stonehenge, A344, Amesbury, Wiltshire SP4 7DE, United Kingdom',
        'Great Wall of China',
        'Hollywood Sign, Los Angeles, CA'
    ];

    this.run = function() {
        //this is a separate function in case we want to swap implementations around calculting distances
        this.getDistanceFromOffice(this.initialData);
    };

    //Note: must call that.output(distanceMap) where distanceMap is an object that maps ( distance -> [location] )
    this.getDistanceFromOffice = function(locationStrings) {
        var service = new google.maps.DistanceMatrixService;
        service.getDistanceMatrix({
            origins: [this.startingAddress],
            destinations: locationStrings,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false
        }, function(response, status) {
            var i,
                distanceMap = {},
                distance,
                location,
                destinationList;
            if (status !== google.maps.DistanceMatrixStatus.OK) {
                alert('Error was: ' + status);
            } else {
                destinationList = response.destinationAddresses;
                log(response);
                var results = response.rows[0].elements;
                for (i = 0; i < results.length; i++) {
                    log(destinationList[i] + ": ", results[i]);
                    if (results[i].status === 'OK') {
                        distance = results[i].distance.value;
                        location = destinationList[i];
                        distanceMap[distance] = distanceMap[distance] || [];
                        distanceMap[distance].push(location);
                    } else {
                        that.$unprocessableLocations.append('<li>' + destinationList[i] + '</li>');
                        log("Google Maps API could not compute distance for location: ", destinationList[i]);
                    }
                }
                log("generated distances", distanceMap);
                that.output(distanceMap);
            }
        });
    };

    //Note: this will not work in IE (yet)
    this.output = function(data) {
        var keys = Object.keys(data),
            i,
            sortedMap = {},
            listItemHTML;
        //supplying comparator to avoid string comparison as we're dealing with numbers
        keys.sort(function(a, b) {
            return Number(a) - Number(b);
        });
        log("sorted distances", keys);
        //now that keys are in proper order, generate new ordered list to prepare for output
        keys.forEach(function(key) {
            if (!sortedMap[key]) {
                sortedMap[key] = [];
            }
            sortedMap[key].push(data[key]);
        });
        log("sorted distances map", sortedMap);
        Object.getOwnPropertyNames(sortedMap).forEach(function(distanceKey) {
            listItemHTML = '<tr>';
            for(i = 0; i < sortedMap[distanceKey].length; i++) {
                listItemHTML += '<td>' + sortedMap[distanceKey][i] + '</td><td>' + distanceKey / 1000 + ' km</td>';
            }
            listItemHTML += '</tr>';
            log('generated row', listItemHTML);
            that.$outputElement.append(listItemHTML);
        });
    };

    function log() {
        if(DEBUG) {
            console.log(arguments);
        }
    }
}
