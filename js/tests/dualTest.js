/* test duals */
bs.multiVector('1e_').dual().strLog('!e: ')

bs.multiVector('1e_0').dual().strLog('!e0: ')
bs.multiVector('1e_1').dual().strLog('!e1: ')
bs.multiVector('1e_2').dual().strLog('!e2: ')
bs.multiVector('1e_3').dual().strLog('!e3: ')

bs.multiVector('1e_10').dual().strLog('!e10: ')
bs.multiVector('1e_20').dual().strLog('!e20: ')
bs.multiVector('1e_30').dual().strLog('!e30: ')
bs.multiVector('1e_12').dual().strLog('!e12: ')
bs.multiVector('1e_13').dual().strLog('!e13: ')
bs.multiVector('1e_23').dual().strLog('!e23: ')

bs.multiVector('1e_120').dual().strLog('!e120: ')
bs.multiVector('1e_130').dual().strLog('!e130: ')
bs.multiVector('1e_230').dual().strLog('!e230: ')
bs.multiVector('1e_123').dual().strLog('!e123: ')

bs.multiVector('1e_1230').dual().strLog('!e1230: ')



bs.multiVector('1e_').dual().unDual().strLog('e: ')

bs.multiVector('1e_0').dual().unDual().strLog('e0: ')
bs.multiVector('1e_1').dual().unDual().strLog('e1: ')
bs.multiVector('1e_2').dual().unDual().strLog('e2: ')
bs.multiVector('1e_3').dual().unDual().strLog('e3: ')

bs.multiVector('1e_10').dual().unDual().strLog('e10: ')
bs.multiVector('1e_20').dual().unDual().strLog('e20: ')
bs.multiVector('1e_30').dual().unDual().strLog('e30: ')
bs.multiVector('1e_12').dual().unDual().strLog('e12: ')
bs.multiVector('1e_13').dual().unDual().strLog('e13: ')
bs.multiVector('1e_23').dual().unDual().strLog('e23: ')

bs.multiVector('1e_120').dual().unDual().strLog('e120: ')
bs.multiVector('1e_130').dual().unDual().strLog('e130: ')
bs.multiVector('1e_230').dual().unDual().strLog('e230: ')
bs.multiVector('1e_123').dual().unDual().strLog('e123: ')

bs.multiVector('1e_1230').dual().unDual().strLog('e1230: ')