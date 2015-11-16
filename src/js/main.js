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

    var debug = false; //this could be cleaned up into a discreet print() function that reads the flag
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
                if (debug) {
                    console.log(response);
                }
                var results = response.rows[0].elements;
                for (i = 0; i < results.length; i++) {
                    if (debug) {
                        console.log(destinationList[i] + ": ", results[i]);
                    }
                    if (results[i].status === 'OK') {
                        distance = results[i].distance.value;
                        location = destinationList[i];
                        distanceMap[distance] = distanceMap[distance] || [];
                        distanceMap[distance].push(location);
                    } else {
                        that.$unprocessableLocations.append('<li>' + destinationList[i] + '</li>');
                        if (debug) {
                            console.log("Google Maps API could not compute distance for location: ", destinationList[i]);
                        }
                    }
                }
                if (debug) {
                    console.log("generated distances", distanceMap);
                }
                that.output(distanceMap);
            }
        });
    };

    //Note: this will not work in IE (yet)
    this.output = function(data) {
        var keys = Object.keys(data),
            i,
            sortedMap = {},
            key,
            listItemHTML;
        //supplying comparator to avoid string comparison as we're dealing with numbers
        keys.sort(function(a, b) {
            return Number(a) - Number(b);
        });
        if (debug) {
            console.log("sorted distances", keys);
        }
        //now that keys are in proper order, generate new ordered list to prepare for output
        for(i = 0; i < keys.length; i++) {
            key = keys[i];
            sortedMap[key] = sortedMap[key] || [];
            sortedMap[key].push(data[key]);
        }
        if (debug) {
            console.log("sorted distances map", sortedMap);
        }
        Object.getOwnPropertyNames(sortedMap).forEach(function(distanceKey) {
            listItemHTML = '<tr>';
            for(i = 0; i < sortedMap[distanceKey].length; i++) {
                listItemHTML += '<td>' + sortedMap[distanceKey][i] + '</td><td>' + distanceKey + ' km</td>';
            }
            listItemHTML += '</tr>';
            if (debug) {

            }
            if (debug) {
                console.log('generated row', listItemHTML);
            }
            that.$outputElement.append(listItemHTML);
        });
    };
}
