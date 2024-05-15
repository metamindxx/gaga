// basis lists & operations
/*********************
** basisSet
*********************/
var basisSet = function (p,q,r) {
	var	bs = {
			// basis: e0, e1, e2, ex, ey, ez, et
			//		- have a basis.sq value of +1, -1, 0
			isA: 'basisSet'
		,	bases: []
		,	basisIdx: {}
		,	basisById: {}
		,	grades: [[]]  // an array of the grades. Initiate grades[0] with []
		,	cayley: []
		,	gradeOrder: null // index of blades ordered by grade
		,	interpretation: null // eg. pga, cga
		}

	// eg adding e2 will also add e12
	bs.addBasis = function(id, sq) {
		var that = bs
//		,	grades = bs.grades
//		,	basis
		,	bases = bs.bases
		,	numBases = bs.bases.length

		// create new basis eg e2
		var newBasisVectorTemplate = bs.basisSet_basis(id, sq, bases[0].idStr + id)

		// what's the new grade?
		for (var b=0; b < numBases; ++b) {
			// create a new blade for each blade existing eg e12
			// the actual vector (the one that gets added to the set) is a child of the scalar and the vectorTemplate
			that.createBasis(bases[b], newBasisVectorTemplate)
			that.bases[b].idStr += '.'
		}




		// add it to the indexes
//		newB.idxNum = bases.length
//		that.basisIdx[id] = newB.idxNum
//		that.bases.push(newB)
//		that.bladeByIdx[id] = newB
	}

	// eg create e23,
	bs.createBasis = function(baseBasis, newBasisVectorTemplate) {
		var that = bs

		// 	bs.basisSet_basis = function (id, sq, idStr) {
		var newBasis = bs.basisSet_basis(baseBasis.id + newBasisVectorTemplate.id, newBasisVectorTemplate.sq, baseBasis.idStr + newBasisVectorTemplate.id)

		// add it to the indexes
		newBasis.idxNum = that.bases.length
		that.basisIdx['id'] = newBasis.idxNum
		newBasis.bsIdx = that.bases.length
//		that.bases.push(newBasis)
		that.bases[newBasis.bsIdx] = newBasis
		that.basisById[newBasis.id] = newBasis

		// 2024-04-24 - put the bases straight into the bs
		that[newBasis.id.replaceAll('_','')] = newBasis


		if (!that.grades[newBasis.grade]) {
			that.grades[newBasis.grade] = []
		}
		that.grades[newBasis.grade].push(newBasis)
	}

	bs.renderHtml = function(options) {
		var that = bs
		var b
		var s = []

		// print in order of creation
		if (options && options.order == 'creation') {
			for (var i=0; i<that.bases.length; ++i) {
				b = that.bases[i]
				s.push(b.id + ': ' + b.idStr)
			}
		// print in grade order
		} else {
			for (var g=0; g<that.grades.length; ++g) {
				for (var i=0; i<that.grades[g].length; ++i) {
					b = that.grades[g][i]
					s.push(b.id + ': ' + b.idStr + ' :' + b.vectorIdxs.join(''))
				}
			}
		}

		return s.join('<br />')
	}

	// create the basis
	bs.basisSet_basis = function (id, sq, idStr) {
		var b = {id: id							// "e_13"
		,	sq: sq								// -1
		,	idStr: idStr						// ".1.3."
		,	vecStr: idStr.replace(/\./g, '')	// "13"
		,	vectorIdxs: []						// [1,3]
		,	bsIdx: 0							// what is my index in bs.bases (which keys into the cayley table)
		}
		b.grade = b.vecStr.length				// 2

		var vecBit
		for (var i=0; i<idStr.length; ++i) {
			vecBit = idStr.substr(i,1)
			if (vecBit != '.')
				b.vectorIdxs.push(i)
		}

		return b
	}

	// eg adding e2 will also add e12
	bs.gpBlades = function(blade1, blade2, options) {
		var b1 = blade1.basis
		,	b2 = blade2.basis

		// have we already worked this out?
		if (bs.cayley[b1.bsIdx] && bs.cayley[b1.bsIdx][b2.bsIdx]) {
			var resultBlade = bs.cayley[b1.bsIdx][b2.bsIdx]
			var result = bs.newBlade(resultBlade.mul * blade1.mul * blade2.mul, resultBlade.basis)
			if (options && options.log) {
				console.log('bs.gpBlades: ' + blade1.s() + ' * ' + blade2.s() + ' = ' + result.s())
			}
			return result
		}


		// start with left vector of right blade and move it across vectors of left blade from right to left
		var b2Idx, b1Idx
		,	moveB1On, sign = 1, iB1CopyStart = 0
		,	newBladeVectors = ''
		,	newBasisId = bs.bases[0].id  // the root of the new id will be the scalar basis id
		for (var i2=0; i2<b2.vectorIdxs.length; ++i2) {
			b2Idx = b2.vectorIdxs[i2]
			moveB1On = false

			// do we have any more b1 vectors?
			if (iB1CopyStart < b1.vectorIdxs.length) {

				// move from right to left of basis 1
				for (var i1=b1.vectorIdxs.length-1; i1>=iB1CopyStart && !moveB1On; --i1) {
					b1Idx = b1.vectorIdxs[i1]

					// move b2 across b1 vector
					if (b1Idx > b2Idx) {
						sign *= -1

						// if we have got to the begining of b1, copy the b2 vector
						if (i1 == iB1CopyStart) {
							newBladeVectors = newBladeVectors + b2Idx
							newBasisId = newBasisId + bs.grades[1][b2Idx].vecStr
						}

					} else {
						// copy over the b1 indexes up to this point
						for (j=iB1CopyStart; j<i1; ++j) {
							newBladeVectors = newBladeVectors + b1.vectorIdxs[j]
							newBasisId = newBasisId + bs.grades[1][b1.vectorIdxs[j]].vecStr
							iB1CopyStart += 1
						}

						// vector match -> contract
						if (b1Idx == b2Idx) {
							sign *= bs.grades[1][b1Idx].sq // contract the match
							iB1CopyStart += 1

						// the b2 vector has moved from the right of b1 and found a lower index in b1.
						// copy over the b1 vector then the b2 vector
						} else { // (b1Idx < b2Idx) {
							newBladeVectors = newBladeVectors + b1Idx
							newBasisId = newBasisId + bs.grades[1][b1Idx].vecStr
							newBladeVectors = newBladeVectors + b2Idx
							newBasisId = newBasisId + bs.grades[1][b2Idx].vecStr
							iB1CopyStart += 1
						}

						moveB1On = true
					}
				}

			// we have run out of b1 vectors. copy over the b2 vector
			} else {
				newBladeVectors = newBladeVectors + b2Idx
				newBasisId = newBasisId + bs.grades[1][b2Idx].vecStr
			}
		}

		// copy over any unused b1 vectors
		for (var i1=iB1CopyStart; i1<b1.vectorIdxs.length; ++i1) {
			newBladeVectors = newBladeVectors + b1.vectorIdxs[i1]
			newBasisId = newBasisId + bs.grades[1][b1.vectorIdxs[i1]].vecStr
		}

		var newBlade = bs.newBlade(sign * blade1.mul * blade2.mul, bs.basisById[newBasisId])
		if (options && options.log) {
			console.log('bs.gpBlades: ' + b1.id + ' * ' + b2.id + ' = ' + sign + bs.bases[0].id + newBladeVectors + ' or ' + newBlade.s())
		}
		return newBlade
	}

	bs.newBlade = function(mul, bss) { // multivector-sub_blade eg -5 e23
		var bl = {
			mul: mul	// 	- the multiplier
		,	basis: bss	//	- the basis
		}
		bl.smul = function(n) { this.mul *= n }
		bl.copy = function () {
			return bs.newBlade(this.mul, this.basis)
		}
		bl.s = function () {
			return '' + this.mul + ' ' + this.basis.id
		}
		bl.html = function () {
			var sign = (this.mul < 0) ? 'neg">-' : 'pos">+'
			if (this.mul == 0) {sign = 'zro">&nbsp;'}
			return '<span class="blade_' + sign + Math.abs(this.mul) + '&nbsp;' + bs.bases[0].id + this.basis.idStr + '</span>'
		}
		return bl
	}

	bs.createCayley = function(symmetricDual) {
		var result
		,	pss = bs.bases[bs.bases.length -1]
		for (var i=0; i<bs.bases.length; ++i) {
			bs.cayley[i] = []
			var bl1 = bs.newBlade(1, bs.bases[i])

			for (var j=0; j<bs.bases.length; ++j) {
				var bl2 = bs.newBlade(1, bs.bases[j])
				result = bs.gpBlades( bl1, bl2 )
				bs.cayley[i][j] =  result

				// let's do manual duals for now.
				/*/ have we found the dual dual
				// bl1 * bl2 = +- pss
				if (result.basis == pss) {
					if (!symmetricDual) {
						bl2.mul = result.mul
					}
					bl1.basis.dual = bl2

					// if the dual is already found for this basis:
					// workout the un-dual for both
					if (bl2.basis.dual) {
						 var undualMultiplier = 1 // bl1.basis.dual.mul * bl2.basis.dual.mul
						 bl1.basis.dual.unDualMul = undualMultiplier
						 bl2.basis.dual.unDualMul = undualMultiplier
					}
				}
				*/
			}
		}

		// order by grade
		bs.gradeOrder = []
		for (var g=0; g<bs.grades.length; ++g) {
			for (var i=0; i<bs.grades[g].length; ++i) {
				bs.gradeOrder.push(bs.grades[g][i])
			}
		}
	}

	bs.setDual = function (basis, dualBasis, sign) {
		basis.dual = this.newBlade(sign, dualBasis)

		// if the dual is already set for the dual basis then set the undual multiplier for both
		if (dualBasis.dual) {
			 basis.dual.unDualMul = dualBasis.dual.mul
			 dualBasis.dual.unDualMul = basis.dual.mul
		}

	}

	bs.cayleyHtml = function(options) {
		var idx = []
		if (options && options.order) {
			for (var i=0; i<options.order.length; ++i)
				idx.push(bs.basisById[options.order[i]])
		} else if (bs.gradeOrder) {
			idx = bs.gradeOrder
		} else {
			// default to blade order
			for (var g=0; g<bs.grades.length; ++g) {
				for (var i=0; i<bs.grades[g].length; ++i)
					idx.push(bs.grades[g][i])
			}
		}

		var s = []
		var blade, rowDualBasis
		s.push('<table class="cayley">')
		for (var i=0; i<idx.length; ++i) {
			rowDualBasis = bs.bases[idx[i].bsIdx].dual.basis
			s.push('<tr>')
			for (var j=0; j<idx.length; ++j) {
				blade = bs.cayley[idx[i].bsIdx][idx[j].bsIdx]
//				if (rowDualBasis.id == blade.basis.id) {
//					s.push('<td><span style="font-weight: bold">')
//				} else {
					s.push('<td>')
//				}
				s.push(blade.html())
				s.push('</td>')
			}
			s.push('</tr>')
		}
		s.push('</table>')
		return s.join('')
	}


	// s = 1e2 + 4e12 - 5e23
	bs.multiVector = function (s) {
		var bs = window.bs
		var	mv = {
			isA: 'mv'
		,	bs: bs
		,	gradeStored: -1
		,	opt: {}
		,	blades: []
		,	bladeIdx: {}
		}

		mv.pushBlade = function(bl) {
			// does this blade already exist?
			var targetBlade = this.bladeIdx[bl.basis.id]
			if (targetBlade) {
				targetBlade.mul += bl.mul
			} else {
				this.blades.push(bl)
				this.bladeIdx[bl.basis.id] = bl
				targetBlade = bl

				// 2024-04-24 - put the blades straight into the mv
				this[bl.basis.id.replaceAll('_','')] = bl
			}

			this.gradeStored = -1
			/*/ check grade
			if (Math.abs(targetBlade.mul) > 0.0001) {  // is this blade significant
				if (this.grade == -1) {
					// first grade. init.
					this.grade = bl.basis.grade
				} else if (this.grade == bl.basis.grade) {
					// the grades match. carry on
				} else {
					// mixed grade
					// the grade is a str eg. '0,2,4'
					// is the new blade already in the string
					//    eg try to find ',2,' in ',0,2,4,'
					if ( (',' + this.grade + ',').indexOf( ',' + bl.basis.grade + ',') == -1) {
						this.grade = this.grade + ',' + bl.basis.grade
						// console.log('mixed grade object: ' + this.grade)
					}
				}
			} else {
				// has everything cancelled? then remove from the grade list
				//if (bl.mul
			}
			*/

		}
		mv.strLog = function (s) {
			var sBits = []
			if(s) {sBits.push(s)}
			var bl // blade
			var idx = (bs.gradeOrder) ? bs.gradeOrder : this.blades
			for (var i=0; i<idx.length; ++i) {
				bl = this.bladeIdx[idx[i].id]

				// is this blade a member of the mv?
				if (bl) {
					if (Math.abs(bl.mul) > 0.01) {
						if (bl.mul >= 0) {
							sBits.push('+' + bl.mul.toFixed(2) + bl.basis.id)
						} else {
							sBits.push(bl.mul.toFixed(2) + bl.basis.id)
						}
					} else {
						// too small
						sBits.push('.....'.substr(0,bl.basis.grade))
					}
				}
			}
			console.log(sBits.join(' '))
			return this
		}
		mv.grade = function () { // bladeFromId('e_01')
			if (this.gradeStored == -1) {
				// recalculate grade
				var blade
				for (var i=0; i< this.blades.length; ++i) {
					blade = this.blades[i]
					if (this.gradeStored == -1) {
						// first grade. init.
						this.gradeStored = blade.basis.grade
					} else if (this.gradeStored == blade.basis.grade) {
						// the grades match. carry on
					} else {
						// mixed grade
						// the grade is a str eg. '0,2,4'
						// is the new blade already in the string
						//    eg try to find ',2,' in ',0,2,4,'
						if ( (',' + this.gradeStored + ',').indexOf( ',' + blade.basis.grade + ',') == -1) {
							this.gradeStored = this.gradeStored + ',' + blade.basis.grade
							// console.log('mixed grade object: ' + this.grade)
						}
					}
				}
			}
			return this.gradeStored
		}
		mv.bl = function (basisId) { // bladeFromId('e_01')
			return this.bladeIdx[basisId]
		}
		mv.bVal = function (basisId) { // bladeFromId('e_01')
			return this.basisSVal(basisId)
		}
		mv.basisSVal = function (basisId) {
			var bl = this.bladeIdx[basisId]
			if (!bl) {
				return 0
			} else {
				return bl.mul
			}
		}
		mv.gp = function (mv2) {
			var mv1 = this
			var mvResult = bs.multiVector('')
			var	bladeResult
			for (var i=0; i< mv1.blades.length; ++i) {
				for (var j=0; j< mv2.blades.length; ++j) {
					bladeResult = bs.gpBlades(mv1.blades[i], mv2.blades[j])
					mvResult.pushBlade(bladeResult)
				}
			}
			return mvResult
		}
		mv.selectGrade = function (grade) {
			var mv = this
			var mvResult = bs.multiVector('')
			for (var i=0; i< mv.blades.length; ++i) {
				if (mv.blades[i].basis.grade == grade) {
					mvResult.pushBlade(mv.blades[i])
				}
			}
			mvResult.gradeStored = grade
			return mvResult
		}
		mv.reverse = function () {
			var mvResult = this.copy()
			,	g
			for (var i=0; i< mvResult.blades.length; ++i) {
				g = mvResult.blades[i].basis.grade
				mvResult.blades[i].mul *= Math.pow(-1, g*(g-1)/2)
			}
			return mvResult
		}
		mv.involute = function () {
			var mvResult = this.copy()
			,	g
			for (var i=0; i< mvResult.blades.length; ++i) {
				g = mvResult.blades[i].basis.grade
				mvResult.blades[i].mul *= Math.pow(-1, g)
			}
			return mvResult
		}
		mv.conjugate = function () {
			var mvResult = this.copy()
			,	g
			for (var i=0; i< mvResult.blades.length; ++i) {
				g = mvResult.blades[i].basis.grade
				mvResult.blades[i].mul *= Math.pow(-1, g*(g+1)/2)
			}
			return mvResult
		}
		// <mv * ~mv>
		mv.normSq = function () {
			var mvResult = this.gp(this.reverse())
			//console.log('normSq.grade: ' + mvResult.grade)
			//mvResult.strLog('normSq.mvResult: ')
			//console.log('normSq: ' + mvResult.bladeIdx[bs.bases[0].id].mul)
			return mvResult.bladeIdx[bs.bases[0].id].mul
		}
		mv.norm = function () {
			return Math.pow(this.normSq(), .5)
		}
		mv.inorm = function () {
			return Math.pow(this.dual().normSq(), .5)
		}
		mv.normalize = function () {
			return this.smul(1/this.norm())
		}
		mv.inverse = function () {
			return this.reverse().smul(1/this.normSq())
		}
		mv.rotorSqrt = function () {
			var scalarExists = this.bladeIdx[bs.bases[0].id]
			var scalar = 0
			if (scalarExists) {
				scalar = Math.sign(this.bVal('e_'))
			}
			if (scalar == 0) {
				scalar = 1
			}
			// add 1 (signed) and normalize
			return this.sadd( scalar ).strLog('sadd(' + scalar + ') : ').normalize()
		}

		// exp(alpha * mv.normalized) = 1 + alpha * mv/1 + alpha^2 * mv^2/2! + alpha^3 * mv^3/3!
		mv.exp = function(alpha) {
			// this.alg
			//alpha = (alpha % (Math.PI * 2)) - Math.PI
			var n = this.smul(alpha)
			var nPow = n.copy()
			var res = n.copy().sadd(1)

			var numTerms = 11
			console.log(numTerms)
			for (i=2; i<numTerms; ++i) {
				nPow = nPow.gp(n).smul(1/i)
				res = res.add(nPow)
			}

			return res
		}

		mv.add = function (mv2) {
			var mvResult = this.copy()
			var	bladeResult, mv2Blade
			for (var i=0; i< mv2.blades.length; ++i) {
				// does the mv2 blade already exist in myResult?
				mv2Blade = mv2.blades[i]
				bladeResult = mvResult.bladeIdx[mv2Blade.basis.id]
				if (bladeResult) {
					bladeResult.mul += mv2Blade.mul
				} else {
					mvResult.pushBlade(mv2Blade.copy())
				}
			}
			return mvResult
		}
		mv.sadd = function (mul) {
			var mv = this.copy()
			var scalarBasis = this.bs.bases[0]

			// add scalar blade if not present
			if (!mv.bladeIdx[scalarBasis.id]) {
				mv.pushBlade( bs.newBlade(mul, scalarBasis) )
			} else {
				mv.bladeIdx[scalarBasis.id].mul += mul
			}
			return mv
		}
		mv.smul = function (mul) {
			var mv = this.copy()
			for (var i=0; i< mv.blades.length; ++i) {
				mv.blades[i].mul *= mul
			}
			return mv
		}
		mv.copy = function () {
			var mv = this
			var mvResult = bs.multiVector('')
			var	bladeResult
			for (var i=0; i< mv.blades.length; ++i) {
				mvResult.pushBlade(mv.blades[i].copy())
			}
			return mvResult
		}
		mv.dual = function () {
			var mv = this
			var mvResult = bs.multiVector('')
			var	dualBlade
			for (var i=0; i< mv.blades.length; ++i) {
				dualBlade = mv.blades[i].basis.dual.copy()
				dualBlade.mul *= mv.blades[i].mul
				mvResult.pushBlade(dualBlade)
			}
			return mvResult
		}
		mv.unDual = function () {
			var mv = this
			var mvResult = bs.multiVector('')
			var	dualBlade
			var blDual
			for (var i=0; i< mv.blades.length; ++i) {
				blDual = mv.blades[i].basis.dual
				dualBlade = blDual.copy()
				dualBlade.mul = mv.blades[i].mul * blDual.unDualMul
				mvResult.pushBlade(dualBlade)
			}
			return mvResult
		}


//--------------
// *** geometry
//--------------

		mv.dot = function(b) {
			var grade = Math.abs(this.grade() - b.grade())
			var res = this.gp(b).selectGrade(grade)
			return res
		}
		mv.projectOnto = function(b) {
			// var project = (a,b)=>(a | b) / b
			// b^-1 = b / b^2
			var bSquared = b.gp(b)
			var dot = this.dot(b)
			var bInverse = b.smul(1 / bSquared.basisSVal('e_'))
			var res = dot.gp(bInverse)
			return res
		}

			// outer product
		mv.op = function(b) {
			var res = this.gp(b).selectGrade(this.grade() + b.grade())
			return res
		}
		mv.join = function(b) {
			// a V b = !( !a * !b )
			var res = (this.dual().op(b.dual())).unDual()
			if (this.gradeStored == 3 && b.gradeStored == 3) {
			res.components = [this,b]
		} else if (this.gradeStored == 2 && b.gradeStored == 3 && this.components) {  //For joinline L in: (L V p)
			res.components = [this.components[0],this.components[1],b]
		} else if (this.gradeStored == 3 && b.gradeStored == 2 && b.components) {  //For joinline L in: (p V L)
			res.components = [this,b.components[0],b.components[1]]
		}
		console.log('res.components:', res.components)
		return res
	}


//--------------
// *** rendering
//--------------
		mv.render =  function (options) {
			if (this.bs.interpretation) {
				// use the interpretation's render routine (eg pga / cga)
				this.bs.interpretation.renderMV(this, options)
			} else {
				alert('no renderer found')
			}
			return this
		}

		// process the mv string
		if (s.trim().length > 0) {
			s = s.replace(/-/g, '+-')
			s = s.replace(/ /g, '')
			var bladesBits = s.split('+')
			var bBits = []
			var basis, basisId
			var grade0Id = bs.bases[0].id
			for (var i=0; i<bladesBits.length; ++i) {
				if (bladesBits[i] != '') { // a - at the start of the string produces an empty bladesBits[0]
					bBits = bladesBits[i].split(grade0Id)
					basisId = grade0Id + bBits[1]
					basis = bs.basisById[basisId]
					if(!basis) {
						console.log('!***** Basis not found: ' + basisId)
					} else {
						mv.pushBlade( bs.newBlade(bBits[0] - 0, basis) )
					}
				}
			}
		}

		return mv
	}

	return bs
}



// kick it off
if (window.bs) {
	alert('woops')
//	return
} else {
	window.bs = basisSet()
}


var bs = window.bs

// create the scalar basis
bs.bases.push(bs.basisSet_basis('e_', 1, ''))
bs.grades[0] = [bs.bases[0]]
bs.e = bs.bases[0]
bs.basisById[bs.bases[0].id] = bs.bases[0]

