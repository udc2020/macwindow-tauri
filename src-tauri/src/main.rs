#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::path::Path;

#[derive(Debug, serde::Serialize)]
pub struct Info {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub is_folder: bool,
}

#[tauri::command]
fn get_info(entries: Vec<(String, String, String, bool)>) -> Vec<Info> {
    let mut final_entrias: Vec<Info> = Vec::new();

    for e in entries.iter() {
        let s = fs::metadata(Path::new(&e.1)).unwrap().len();

        final_entrias.push(Info {
            name: String::from(&e.0),
            path: String::from(&e.1),
            size: s,
            is_folder: e.3,
        });
    }

    final_entrias
}

#[tauri::command]
#[warn(unused_must_use)]
fn rename_files(old_path: &str, new_name: &str) {
    fs::rename(old_path, new_name).ok();
}
#[tauri::command]
#[warn(unused_must_use)]
fn remove_files(path: &str, is_folder: bool) {
    if is_folder {
        fs::remove_dir(path).ok();
    } else {
        fs::remove_file(path).ok();
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_info,
            rename_files,
            remove_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
