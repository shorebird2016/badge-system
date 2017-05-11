angular.module('badgeApp', [])
    .controller('badgeCtrl', ['$http', function ($http) {
        var vm = this;
        vm.members = [];
        vm.filteredMembers = [];//initially full list

        //----------------- View manipulation ---------------------
        vm.clearFields = function () {
            $('#ENTRY_ID').val("");
            $('#ENTRY_LAST_NAME').val("");
            $('#ENTRY_FIRST_NAME').val("");
        };
        vm.showNoPhoto = function () {
            vm.membersWithoutImage = [];
            for (idx = 0; idx < badImages.length; idx++) {
                var tokens = badImages[idx].split('/');//look for the last token
                var last_token = tokens[tokens.length - 1];
                var id = last_token.substr(0, last_token.length - 4);//ignore .jpg
                if (!vm.membersWithoutImage.includes(id))
                    vm.membersWithoutImage.push(id);
            }
        };

        //----------------- Helpers ---------------------
        //--read member data from CSV file when page load
        var memberRecords = [];
        vm.processData = function(allText) {
            var allTextLines = allText.split(/\r\n|\n/);
            var headers = allTextLines[0].split(',');
            for (var i=1; i<allTextLines.length; i++) {
                var data = allTextLines[i].split(',');
                if (data.length == headers.length) {
                    var tarr = [];
                    for (var j=0; j<headers.length; j++) {
                        tarr.push(/*headers[j]+ ":" + */data[j]);
                    }
                    memberRecords.push(tarr);
                }
            }
            //convert them into Member objects
            vm.members = [];
            for (idx = 0; idx < memberRecords.length; idx++) {
                var id = memberRecords[idx][0];
                var mbr = new Member(id, memberRecords[idx][1], memberRecords[idx][2],
                    memberRecords[idx][4], memberRecords[idx][3], "image/" + id + ".jpg");
                vm.members[idx] = mbr;
            }
            vm.filteredMembers = vm.members;
            console.log("Found " + vm.members.length + " members.");
        };

        //filter records based on user selections
        vm.filter = function(user_choice) {
            var type = ""; var loc = "";
            var id = ""; var last = ""; var first = "";
            switch(user_choice) {
                case 0: //all members
                    vm.filteredMembers = vm.members;
                    return;

                //1~3 based on type
                case 1: type = "Regular";  break;
                case 2: type = "Lifetime"; break;
                case 3: type = "Inner Circle"; break;

                //10~30 query for locations
                case 10: loc = "Milbrae 1"; break;
                case 11: loc = "Milbrae 2"; break;
                case 12: loc = "Cupertino 1"; break;
                case 13: loc = "Cupertino 2"; break;
                case 14: loc = "Center"; break;
                case 15: loc = "HQ-BG"; break;
                case 16: loc = "Almaden"; break;
                case 17: loc = "Evergreen"; break;
                case 18: loc = "Milpitas"; break;
                case 19: loc = "Fremont 1"; break;
                case 20: loc = "Fremont 2"; break;
                case 21: loc = "San Jose"; break;
                case 22: loc = "Sunnyvale"; break;

                //use DOM to find values entered in those 3 fields, then apply search
                default: type = "";  break;
            }
            mbr = new Member(-1, "", "", type, loc);
            vm.findMembersByTemplate(mbr);
        };

        //to find members based on setting in Member object
        vm.findMembersByTemplate = function(member_template) {
            vm.filteredMembers = [];
            id = member_template.id;
            //convert id into string
            last_name = member_template.lastName;
            first_name = member_template.firstName;
            type = member_template.type;
            loc = member_template.location;
            for (row = 0; row < vm.members.length; row++) {
                //trying to find matches in fields
                id_match = (id == -1) || (id == vm.members[row].id);//id=-1, don't use id for comparison
                //empty last name or first name - considered as pass
                lname_match = (last_name == "") || (last_name && vm.stringEqual(last_name, vm.members[row].lastName));
                fname_match = (first_name == "") || (first_name && vm.stringEqual(first_name, vm.members[row].firstName));
                //empty string !type eval to true
                type_match = !type || (type && vm.stringEqual(type, vm.members[row].type));
                loc_match = !loc || (loc && vm.stringEqual(loc, vm.members[row].location));
                if (id_match && lname_match && fname_match && type_match && loc_match) {
                    ret = new Member(vm.members[row].id, vm.members[row].lastName,
                        vm.members[row].firstName, vm.members[row].type, vm.members[row].location, vm.members[row].image);
                    vm.filteredMembers[vm.filteredMembers.length] = ret;//add to the end
                    // console.log("Found # " + vm.members[row].id);
                }
            }
            if (vm.filteredMembers.length === 0)
                console.log("Record Not Found...........");
            else console.log("Found " + vm.filteredMembers.length + " members.");
        };

        //compare without case
        vm.stringEqual = function(string1, string2) {
            if (!string1)
                return false;
            if (!string2)
                return false;
            if (string1.toLowerCase() === string2.toLowerCase())
                return true;
            return false;
        };

        //find a set of members based on user entries in 3 fields
        vm.findMember = function() {
            //use selector to get id from field, very strangely, they need to use .val(), .text() doesn't work
            var id = parseInt($('#ENTRY_ID').val(), 10);//when empty NaN returned
            var lname = $('#ENTRY_LAST_NAME').val();//when empty, empty string returned
            var fname = $('#ENTRY_FIRST_NAME').val();//when empty, empty string returned

            //if id NaN, set to -1
            if (!id && lname == "" && fname == "") {//nothing entered
                vm.filteredMembers = vm.members;
                return;
            }
            if (!id) id = -1;//empty id
            mbr = new Member(id, lname, fname, "", "");
            vm.findMembersByTemplate(mbr);
            vm.clearFields();
        };

        //----------------- Accessors ---------------------
        vm.getMemberType = function(member) {
            if (member.type == "Regular") return "REG";
            else if (member.type == "Lifetime") return "LT";
            else return "ICT";
        };
        vm.getLocation = function (member) {
            return member.location;
        };

        //------------------ Initialization --------------------
        //--- use HTTP to read text file when page is loaded
        $http.get('records.csv').then(function (payload) {
            vm.processData(payload.data);
        }, function (err) {
            console.log("*** Oops! Can NOT read records.csv ***");
        });
        //object template
        function Member(id, last_name, first_name, type, location, image) {
            this.id = id;
            this.lastName = last_name;
            this.firstName = first_name;
            this.type = type;
            this.location = location;
            this.image = image;
            this.imageExist = true;
        }
    }])
    //---special method to detect photo availability
    .factory('Utils', function($q) {
        return {
            isImage: function(src) {
                var deferred = $q.defer();
                var image = new Image();
                image.onerror = function() {
                    deferred.resolve(false);
                };
                image.onload = function() {
                    deferred.resolve(true);
                };
                image.src = src;
                return deferred.promise;
            }
        };
})

    //---custom directive to handle bad image URL or broken images
    .factory('settings', function () {
        return { noImageUrl: "no-photo.jpg" };
    })
    .directive('noImage', function (settings) {
        var setDefaultImage = function (elem) {
            elem.attr('src', settings.noImageUrl);
        };
        return {
            restrict: 'A',
            link: function (scope, elem, attr) {
                scope.$watch(function () {
                    return attr.ngSrc;
                }, function () {
                    var src = attr.ngSrc;
                    if (!src)
                        setDefaultImage(elem);
                });
                elem.bind('error', function () {
                    setDefaultImage(elem);
                })
            }
        }
    });

//use global array to track member without photos
function markImage(image) {
    console.log("....." + image.src);
    //accumulate them into a global list
    badImages.push(image.src);
}
badImages = [];

//TODO (1) Handle photo loading error from within angular such that bad URL will not be requested again
//TODO (2) There is still a small gap between "album" and "footer" of 20px, not sure where it comes from???
//TODO (3) Better looking search box
//TODO (4) lightbox broken on non-exist photo