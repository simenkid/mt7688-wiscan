var  exec = require('child_process').exec;

var iwinfo = {};

iwinfo.scan = function (intf, callback) {
    var child = exec('time iwinfo ' + intf + ' scan', function (error, stdout, stderr) {
        if (error)
            return callback(err);

        var info = stdout,
            parsed = [];

        info = info.replace(/\n/g, ' ');
        info = info.replace(/:/g, '');
        info = info.replace(/"/g, '');
        info = info.split(' ');
        info.forEach(function (char, i) {
            if (char === 'ESSID' && info[i+1] === '')
                info[i+1] = 'unknown';
            else if (char !== '')
                parsed.push(char);
        });

        parsed = parse(parsed);
        callback(null, parsed);
    });
};

iwinfo.scanByEssid = function (intf, essid, callback) {
    var hit = false,
        target;

    iwinfo.scan(intf, function (err, infos) {
        if (err)
            return callback(err);

        infos.forEach(function (info) {
            if (info.essid === essid) {
                hit = true;
                target = info;
            }
        });

        if (hit)
            callback(null, target);
        else
            callback(new Error(essid + ' not found.'));
    });
};

function parse(items) {
    var parsed = [],
        len = items.length,
        idx = 0;

    if (items.length === 0)
        return parsed;

    items.forEach(function (c, i) {
        var val;
        if (c === 'Cell') {
            val = items[i+1];
            val = isNaN(parseInt(val)) ? val : parseInt(val);
            parsed.push({ cell: val });
        } else if (c === 'Address') {
            parsed[idx].address = items[i+1];
        } else if (c === 'ESSID') {
            parsed[idx].essid = items[i+1];
        } else if (c === 'Mode') {
            parsed[idx].mode = items[i+1];
        } else if (c === 'Channel') {
            val = items[i+1];
            val = isNaN(parseInt(val)) ? val : parseInt(val);
            parsed[idx].channel = val;
        } else if (c === 'Signal') {
            val = items[i+1];
            val = isNaN(parseInt(val)) ? val : parseInt(val);
            parsed[idx].signal = val;
        } else if (c === 'Quality') {

            val = items[i+1].split('/')[0];
            val = isNaN(parseInt(val)) ? val : parseInt(val);
            parsed[idx].quality = val;
        } else if (c === 'Encryption') {
            var x = i + 1;
                enc = '';

            while (items[x] !== 'Cell') {
                if (x !== len) {
                    enc = enc + items[x] + ' ';
                    x += 1;
                } else {
                    break;
                }
            }
            enc = enc.trim();
            parsed[idx].encryption = enc;
            idx += 1;
        }
    });

    return parsed;
}

module.exports = iwinfo;
