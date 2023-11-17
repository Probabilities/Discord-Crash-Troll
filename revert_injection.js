const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

(async() => {
    console.clear()
    for(const directory of fs.readdirSync(process.env.LOCALAPPDATA, 'utf-8')) {
        if(directory.toLowerCase().includes('discord')){
            for(const dir of fs.readdirSync(path.join(process.env.LOCALAPPDATA, directory), 'utf-8')){
                if(dir.match(/app-(\d*\.\d*)*/g)){
                    const absolutePath = path.join(process.env.LOCALAPPDATA, directory, dir);
            
                    let pattern = path.join(absolutePath, 'modules', 'discord_desktop_core-*', 'discord_desktop_core', 'index.js').replace(/\\/g, '/');
    
                    const withModules = globSync(pattern);
                    if(!withModules) continue

                    withModules.forEach((directory) => {
                        if(fs.existsSync(directory)){
                            if(fs.readFileSync(directory, 'utf-8') == `module.exports = require('./core.asar');`){
                                console.log('[+] Detected no injection:', directory)
                            }else{
                                fs.writeFileSync(directory, `module.exports = require('./core.asar');`)
                                console.log('[+] Removed injection:', directory)
                            }
                        }
                    });   
                }
            }
        }
    }

    console.log(`\n[+] Removed all injection.`)
})()