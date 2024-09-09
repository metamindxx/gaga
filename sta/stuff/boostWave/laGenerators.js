var laGenerators = function () {
    var i = [0,1]
    var mi = [0,-1]
    var o = [0,0]
    var g = {
        i: [0,1]
    ,   mi: [0,-1]
    ,   o: [0,0]
    ,   Jyz: [
            // x, y, z, t
            [ o, o, o, o] // x 
        ,   [ o, o,mi, o] // y 
        ,   [ o, i, o, o] // z 
        ,   [ o, o, o, o] // t 
        ]

    ,   Jxz: [
            // x, y, z, t
            [ o, o, i, o] // x 
        ,   [ o, o, o, o] // y 
        ,   [mi, o, o, o] // z 
        ,   [ o, o, o, o] // t 
        ]

    ,   Jxy: [
            // x, y, z, t
            [ o,mi, o, o] // x 
        ,   [ i, o, o, o] // y 
        ,   [ o, o, o, o] // z 
        ,   [ o, o, o, o] // t 
        ]

    ,   Kxt: [
            // x, y, z, t
            [ o, o, o, i] // x 
        ,   [ o, o, o, o] // y 
        ,   [ o, o, o, o] // z 
        ,   [ i, o, o, o] // t 
        ]

    ,   Kyt: [
            // x, y, z, t
            [ o, o, o, o] // x 
        ,   [ o, o, o, i] // y 
        ,   [ o, o, o, o] // z 
        ,   [ o, i, o, o] // t 
        ]

    ,   Kzt: [
            // x, y, z, t
            [ o, o, o, o] // x 
        ,   [ o, o, o, o] // y 
        ,   [ o, o, o, i] // z 
        ,   [ o, o, i, o] // t 
        ]
       
    , complexAdd(a,b) {
        return [a[0] + b[0], a[1] + b[1]]
    }

    , complexMul(a,b) {
        return [a[0]*b[0] + a[1]*b[1], a[0]*b[1] + a[1]*b[0]   ]
    }

    , complexStr(a) {
        if (a[0] == 0) {
            if (a[1] == 0) { return '0'
            } else if (a[1] == 1) { return 'i'                
            } else if (a[1] == -1) { return '-i'                
            } else { return '' + a[1] + 'i'
            }
        } else {
            if (a[1] == 0) {
                return a[0]
            } else if (a[1] == 1) { a[0] + ' + ' + 'i'
        } else { 
            return a[0] + ' + ' + a[1] + 'i'
            }
        }
    }

    , add: function(a, b) {
        var res = []
        var temp
        for (var iRow=0; iRow<4; ++iRow) {
            res[iRow] = []
            for (var iCol=0; iCol<4; ++iCol) {
                res[iRow][iCol] = this.complexAdd(a[iRow][iCol], b[iRow][iCol])
            }
        }
        //this.strLog(res)
        return res
    }

    , strLog(a, intro) {
        if (intro) {console.log(intro)}
        var bits = []
        for (var i=0; i<4; ++i) {
            var bits = []
            for (var j=0; j<4; ++j) {
                bits.push(this.complexStr(a[i][j]))
            }
            console.log(i + ': [' + bits.join(' ') + ']')
        }

    }

    , smul: function(a, alpha) {
        var res = []
        for (var iRow=0; iRow<4; ++iRow) {
            res[iRow] = []
            for (var iCol=0; iCol<4; ++iCol) {
                res[iRow][iCol] = []
                res[iRow][iCol][0] = alpha * a[iRow][iCol][0]
                res[iRow][iCol][1] = alpha * a[iRow][iCol][1]
            }
        }
        return res
    }

    , cmul: function(a, c) {
        var res = []
        for (var iRow=0; iRow<4; ++iRow) {
            res[iRow] = []
            for (var iCol=0; iCol<4; ++iCol) {
                res[iRow][iCol] = this.complexMul(a[iRow][iCol], c)
            }
        }
        return res
    }

    , mul: function(a, b) {
        var res = []
        var temp, rowColSum
        for (var iRow=0; iRow<4; ++iRow) {
            res[iRow] = []
            for (var iCol=0; iCol<4; ++iCol) {
                rowColSum = [0, 0]
                for (var i=0; i<4; ++i) {
                    temp = this.complexMul(a[iRow][i], b[i][iCol])
                    rowColSum = this.complexAdd(rowColSum, temp)
                }
                res[iRow][iCol] = rowColSum
            }
        }
        return res
    }

    , bracket: function(a, b) {
        var ab = this.mul(a,b)
        var ba = this.mul(b,a)
        return this.add(ab, this.smul(ba, -1))
    }

    }
    return g
}