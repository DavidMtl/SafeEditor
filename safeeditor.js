var current_directory_path = "";
var current_file_path = "&nbsp;";
var codeMirrorEditor;
document.addEventListener('DOMContentLoaded', function() {

    document.getElementById("demo_app_button").addEventListener("click", function(){
        document.getElementById("app_name").value = "SAFE Demo APP";
        document.getElementById("app_version").value = "0.6.0";
        document.getElementById("app_vendor").value = "MaidSafe";
        document.getElementById("app_id").value = "com.maidsafe.demo_app";
    });

  	document.getElementById("save_custom_button").addEventListener("click", function(){
        var app_name = document.getElementById("app_name").value;
        var app_version = document.getElementById("app_version").value;
        var app_vendor = document.getElementById("app_vendor").value;
        var app_id = document.getElementById("app_id").value;

      	localStorage["app_name"]=app_name;
      	localStorage["app_version"]=app_version;
      	localStorage["app_vendor"]=app_vendor;
      	localStorage["app_id"]=app_id;
    });

  	document.getElementById("load_custom_button").addEventListener("click", function(){
      document.getElementById("app_name").value = localStorage["app_name"] ? localStorage["app_name"] : "";
      document.getElementById("app_version").value = localStorage["app_version"] ? localStorage["app_version"] : "";
      document.getElementById("app_vendor").value = localStorage["app_vendor"] ? localStorage["app_vendor"] : "";
      document.getElementById("app_id").value = localStorage["app_id"] ? localStorage["app_id"] : "";
    });

    document.getElementById("auth_button").addEventListener("click", function(){
        var app_name = document.getElementById("app_name").value;
        var app_version = document.getElementById("app_version").value;
        var app_vendor = document.getElementById("app_vendor").value;
        var app_id = document.getElementById("app_id").value;

        authorize(app_name, app_id, app_version, app_vendor);
    });

    document.getElementById("save_button").addEventListener("click", function(){
        save_file(current_file_path, codeMirrorEditor.getValue());
	});

  	document.getElementById("new_file_button").addEventListener("click", function(){
      	var filename = prompt("Please enter the file name", "New file");
      	if (filename != null) {
        	var filepath = current_directory_path + filename;
        	create_file(filepath, " ");
      	}
	});

  	document.getElementById("new_public_directory_button").addEventListener("click", function(){
      	var director_name = prompt("Please enter the directory name", "New directory");
      	if (director_name != null) {
        	var directory_path = current_directory_path + director_name;
       	 	create_directory(directory_path, false);
      	}
	});

    document.getElementById("new_private_directory_button").addEventListener("click", function(){
      	var director_name = prompt("Please enter the directory name", "New directory");
      	if (director_name != null) {
        	var directory_path = current_directory_path + director_name;
       	 	create_directory(directory_path, true);
      	}
	});

	load_app_info();
    get_directory("");

    codeMirrorEditor = CodeMirror(document.getElementById("editor-content"), {
        value: "",
        mode:  "javascript",
        theme: "lesser-dark",
      	lineNumbers: true
    });
}, false);

function create_file(filepath, filecontent) {
  log("Creating new file:  " + filepath);
  set_busy(true);
  nfsFile(POST,filepath, filecontent).then(function(success_text) {
    set_busy(false);
    get_directory(current_directory_path);
  }).catch(function(error_text) {
    log("File creation error:" + error_text);
    set_busy(false);
  });
}

function create_directory(directory, isPrivate) {
  var root_path = get_selected_root_path();
  log("Creating new directory:  " + directory);
  set_busy(true);
  nfsDirectory(POST,root_path, directory, isPrivate).then(function(success_text) {
    set_busy(false);
    get_directory(current_directory_path);
  }).catch(function(error_text) {
    log("Directory creation error:" + error_text);
    set_busy(false);
  });
}

function delete_file(filepath) {
  log("Deleting file:  " + filepath);
  set_busy(true);
  nfsFile(DELETE,filepath).then(function(success_text) {
		log(current_file_path);
    	set_busy(false);
    	get_directory(current_directory_path);
	}).catch(function(error_text) {
		log("Delete error:" + error_text);
    	set_busy(false);
  	});
}

function delete_directory(folderpath) {
  var root_path = get_selected_root_path();
  log("Deleting folder:  " + folderpath);
  set_busy(true);
  nfsDirectory(DELETE, root_path, folderpath).then(function(success_text) {
		log(current_file_path);
    	set_busy(false);
    	get_directory(current_directory_path);
	}).catch(function(error_text) {
		log("Delete error:" + error_text);
    	set_busy(false);
  	});
}

function authorize(app_name, app_id, app_version, app_vendor) {
  	log("Authorizing...");
    set_busy(true);
    auth(POST, app_name, app_id, app_version, app_vendor).then(function(success_text) {
      	set_busy(false);
      	current_directory_path = "";
      	current_file_path = "&nbsp;";
      	codeMirrorEditor.setValue("");
        get_directory("");
        log(current_file_path);
    }).catch(function(error_text) {
        log("Authorization error:" + error_text);
      	set_busy(false);
    });
}

function save_file(filepath, filecontent) {
    log("Deleting old file...");
  	set_busy(true);
  	document.getElementById("save_button").disabled = true;
    nfsFile(DELETE,filepath).then(function(success_text) {
		log("Creating new file...");
		nfsFile(POST,filepath, filecontent).then(function(success_text) {
			log(current_file_path);
          	document.getElementById("save_button").disabled = false;
          	set_busy(false);
		}).catch(function(error_text) {
			log("File creation error:" + error_text);
          	set_busy(false);
		});
	}).catch(function(error_text) {
		nfsFile(POST,filepath, filecontent).then(function(success_text) {
			log(current_file_path);
          	document.getElementById("save_button").disabled = false;
          	set_busy(false);
		}).catch(function(error_text) {
			log("File creation error:" + error_text);
          	set_busy(false);
		});
	});
}

function get_directory(directory_path) {
    var root_path = get_selected_root_path();
  	set_busy(true);
  	log("Getting directory...:  " + directory_path);
    nfsDirectory(GET, root_path, directory_path).then(function(success_text) {
        log(current_file_path);
        var content = JSON.parse(success_text);

        var subfolder_list = document.getElementById("subfolder_list");
        subfolder_list.innerHTML = "";

        if (current_directory_path != "") {
            var div = document.createElement("div");
            var a = document.createElement("A");
            var t = document.createTextNode("../");

            div.appendChild(a);
            a.appendChild(t);
            a.href = "#";
            a.title = "../";
          	a.style.marginRight = "30px";
            a.onclick = function () {
                var directory_path = get_parent_directory();
                get_directory(directory_path);
                current_directory_path = directory_path;
            }
            subfolder_list.appendChild(div);
        }

        var length = content.subDirectories.length;
        for (var i = 0; i < length; i++) {
            var div = document.createElement("div");
            var a = document.createElement("A");
          	var b = document.createElement("button");
            var t = document.createTextNode(content.subDirectories[i].name + "/");
            div.appendChild(a);
          	div.appendChild(b);
            a.appendChild(t);
            a.href = "#";
            a.title = content.subDirectories[i].name;
            a.onclick = function () {
                current_directory_path += this.title + "/";
                get_directory(current_directory_path);
            }
            b.onclick = function () {
              	var directory = current_directory_path + this.title + "/";
                var r = confirm("Are you sure you want to delete " + directory + "? This operation cannot be reversed.");
                if (r == true) {
                    delete_directory(directory);
                }
            }
            b.className = "delete_button";
          	b.innerHTML = "x";
          	b.title = content.subDirectories[i].name;
            subfolder_list.appendChild(div);
        }

        var file_list = document.getElementById("file_list");
        file_list.innerHTML = "";
        var length = content.files.length;
        for (var i = 0; i < length; i++) {
            var filename = content.files[i].name;
            var div = document.createElement("div");
            var a = document.createElement("A");
          	var b = document.createElement("button");
            var t = document.createTextNode(filename);
            div.appendChild(a);
          	div.appendChild(b);
            a.appendChild(t);
            a.href = "#";
            a.title = filename;
            a.onclick = function () {
                var filepath = current_directory_path + this.title;
                get_file(filepath);
            }
            b.onclick = function () {
              	var filepath = current_directory_path + this.title;
                var r = confirm("Are you sure you want to delete " + filepath + "? This operation cannot be reversed.");
                if (r == true) {
                    delete_file(filepath);
                }
            }
            b.className = "delete_button";
          	b.innerHTML = "x";
          	b.title = filename;
            file_list.appendChild(div);
        }
      	set_busy(false);
    }).catch(function(error_text) {
        log("Directory error:" + error_text + " try authorizing again.");
      	set_busy(false);
    });
}

function get_file(filepath) {
  	log("Getting file...:  " + filepath);
  	set_busy(true);
    nfsFile(GET, filepath).then(function(success_text) {
        current_file_path = filepath;
        set_editor_content(filepath, success_text);
      	document.getElementById("log_status").innerHTML = filepath;
      	set_busy(false);
    }).catch(function(error_text) {
        log("File error:" + error_text);
      	document.getElementById("log_status").innerHTML = "&nbsp;";
      	set_busy(false);
    });
}

function get_selected_root_path() {
    return APP;
}

function set_editor_content(filename, content) {
	codeMirrorEditor.setValue(content);
 	if (filename.endsWith(".js")) {
      	codeMirrorEditor.setOption("mode", "javascript");
    } else if (filename.endsWith(".css")) {
        codeMirrorEditor.setOption("mode", "css");
    } else if (filename.endsWith(".html")) {
        codeMirrorEditor.setOption("mode", "htmlembedded");
    }
}

function get_parent_directory() {
    var folders = current_directory_path.split('/');
    folders.length = folders.length - 2;
    var parent_directory = "";
    for (var i = 0; i < folders.length; i++) {
        parent_directory += folders[i] + "/";
    }
    return parent_directory;
}

function set_busy(is_busy) {
  if (is_busy) {
      document.getElementById("busy_container").style.display = "inline";
    } else {
      document.getElementById("busy_container").style.display = "none";
    }
}

function log(message) {
    document.getElementById("log_status").innerHTML = message;
}

function load_app_info() {
	document.getElementById("app_name").value = localStorage["app_name"] ? localStorage["app_name"] : "SAFE Demo APP";
  	document.getElementById("app_version").value = localStorage["app_version"] ? localStorage["app_version"] : "0.6.0";
  	document.getElementById("app_vendor").value = localStorage["app_vendor"] ? localStorage["app_vendor"] : "MaidSafe";
  	document.getElementById("app_id").value = localStorage["app_id"] ? localStorage["app_id"] : "com.maidsafe.demo_app";
}
