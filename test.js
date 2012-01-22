(function(){

	var chunkSeparator = '_' 
	, charmap = {} // {'1':'g','2':'h','3':'i','4':'j','5':'k','6':'l','7':'m','8':'n','9':'o','a':'p','b':'q','c':'r','d':'s','e':'t','f':'u','0':'v'}
	, charmap_reverse = {} // will be filled by 'uncompress*" function
	, allchars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX'
	, bitness = allchars.length / 2
	, minus = 'Z'
	, plus = 'Y'
	
	for(var i = bitness-1; i > -1; i--){
		charmap[allchars[i]] = allchars[i+bitness]
		charmap_reverse[allchars[i+bitness]] = allchars[i]
	} 
	console.log(charmap)
	
	// letters left: w, y
	var remapTailChars = function(number){
		// for any given number, returning string like so:
		// 345 -> '3de'
		var chars = number.split('') 
		, l = chars.length
		// we are skipping first char. standard hex number char = delimiter
		for (var i = 1; i < l; i++ ){
			chars[i] = charmap[chars[i]]
		}
		return chars.join('')
	}
	, compressstrokeleg = function(data){
		// we convert half-stroke (only 'x' series or only 'y' series of numbers)
		// data is like this:
		// [517,516,514,513,513,513,514,516,519,524,529,537,541,543,544,544,539,536]
		// that is converted into this:
		// "5agm12100p1235584210m53"
		// each number in the chain is converted such:
		// - find diff from previous number
		// - first significant digit is kept as digit char. digit char = start of new number.
		// - consecutive numbers are mapped to letters, where 1 to 9 are A to I, 0 is O
		// Sign changes are denoted by "P" - plus, "M" for minus.
		var answer = []
		, lastwhole = 0
		, last = 0
		, lastpolarity = 1
		, l = data.length
		, nwhole, n, absn
		
		for(var i = 0; i < l; i++){
			// we start with whole coordinates for each point
			// coords are converted into series of vectors:
			// [512, 514, 520]
			// [512, +2, +6]
			nwhole = data[i]
			n = nwhole - lastwhole			
			lastwhole = nwhole

			// inserting sign change when needed.
			if (n < 0 && lastpolarity > 0) {
				lastpolarity = -1
				answer.push(minus)
			}
			else if (n > 0 && lastpolarity < 0) {
				lastpolarity = 1
				answer.push(plus)
			}
			
			// since we have dealt with sign. let's absolute the value.
			absn = Math.abs(n)
			// adding number to list  We convert these to Hex before storing on the string.
			if (absn >= bitness) {
				answer.push(remapTailChars(absn.toString(bitness)))
			} else {
				answer.push(absn.toString(bitness))
			}
		}
		return answer.join('')
	}
	, compressstrokes = function(data){
		var answer = []
		, l = data.length
		, stroke
		for(var i = 0; i < l; i++){
			stroke = data[i] 
			answer.push(compressstrokeleg(stroke.x))
			answer.push(compressstrokeleg(stroke.y))
		}
		return answer.join(chunkSeparator)
	}
	, uncompressstrokeleg = function(datastring){
		// we convert half-stroke (only 'x' series or only 'y' series of numbers)
		// datastring like this:
		// "5agm12100p1235584210m53"
		// is converted into this:
		// [517,516,514,513,513,513,514,516,519,524,529,537,541,543,544,544,539,536]
		// each number in the chain is converted such:
		// - digit char = start of new whole number. Alpha chars except "p","m" are numbers in hiding.
		//   These consecutive digist expressed as alphas mapped back to digit char.
		//   resurrected number is the diff between this point and prior coord.
		// - running polaritiy is attached to the number.
		// - we undiff (signed number + prior coord) the number.
		// - if char 'm','p', flip running polarity 
		var answer = []
		, chars = datastring.split('')
		, l = chars.length
		, char
		, polarity = 1
		, partial = []
		, preprewhole = 0
		, prewhole
		for(var i = 0; i < l; i++){
			char = chars[i]
			if (char in charmap || char === minus || char === plus){
				// this is new number - start of a new whole number.
				// before we can deal with it, we need to flush out what we already 
				// parsed out from string, but keep in limbo, waiting for this sign
				// that prior number is done.
				// we deal with 3 numbers here:
				// 1. start of this number - a diff from previous number to 
				//    whole, new number, which we cannot do anything with cause
				//    we don't know its ending yet.
				// 2. number that we now realize have just finished parsing = prewhole
				// 3. number we keep around that came before prewhole = preprewhole

				if (partial.length !== 0) {
					// yep, we have some number parts in there.
					prewhole = parseInt( partial.join(''), bitness) * polarity + preprewhole
					answer.push( prewhole )
					preprewhole = prewhole
				}

				if (char === minus){
					polarity = -1
					partial = []
				} else if (char === plus){
					polarity = 1
					partial = []
				} else {
					// now, let's start collecting parts for the new number:
					partial = [char]					
				}
			} else /* alphas replacing digits */ {
				// more parts for the new number
				partial.push(charmap_reverse[char])
			}
		}
		// we always will have something stuck in partial
		// because we don't have closing delimiter
		answer.push( parseInt( partial.join(''), bitness ) * polarity + preprewhole )
		
		return answer
	}
	, uncompressstrokes = function(datastring){
		var data = []
		, chunks = datastring.split(chunkSeparator)
		, l = chunks.length / 2
		for (var i = 0; i < l; i++){
			data.push({
				'x':uncompressstrokeleg(chunks[i*2])
				, 'y':uncompressstrokeleg(chunks[i*2+1])
			})
		}
		return data
	}
	
	
	$('#controls').on('click', function(){
		var data = $('#signature').jSignature('getData', 'strokes')
		, cdata = compressstrokes(data)
		, newdata = uncompressstrokes(cdata)
		, newcdata = compressstrokes(newdata)

		console.log(cdata, ' ', cdata.length, '  ', cdata === newcdata)
		console.log(newcdata)
	})
	

	
}).call(typeof window !== 'undefined'? window : this)