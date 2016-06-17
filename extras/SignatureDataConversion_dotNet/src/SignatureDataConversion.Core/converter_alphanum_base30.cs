using System;
using System.Collections.Generic;
using System.Text;

namespace jSignature.Tools
{
    /// <summary>
    /// This class Converts jSignature data into compressed alphanum base30 string and back.
    /// </summary>
    public class Base30Converter
    {
        /// <summary>
        /// These chars' place numbers correspond to the number they represent.
        /// </summary>
        string ALLCHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX";
	    int bitness;
	    char MINUS = 'Z';
        char PLUS = 'Y';

        Dictionary<char, int> charmap;
        Dictionary<char, int> charmap_tail;

        public Base30Converter(){
            bitness = ALLCHARS.Length / 2; // will equal 30

            charmap = new Dictionary<char,int>();
            charmap_tail = new Dictionary<char,int>();
            for (int i = 0; i < bitness; i++)
            {
                charmap.Add(ALLCHARS[i], i);
                charmap_tail.Add(ALLCHARS[i+bitness], i);
            }
        }

        private int FromBase30(List<int> data)
        {
            int len = data.Count;
            if (len == 1)
            {
                return data[0];
            }
            else
            {
                data.Reverse();
                // now we know that we have at least 2 elems.
                double answer = data[0] + data[1] * bitness;
                for (int i = 2; i < len; i++)
                {
                    answer = answer + data[i] * Math.Pow(bitness, i);
                }
                return (int)answer;
            }
        }

        private List<int> ToBase30(int val)
        {
            List<int> retVal = new List<int>();

            //Determine the max power of bitness
            int pow = 0;
            while (Math.Pow(bitness, pow + 1) < val) pow++;
            
            //Iterate through each of the powers of the bitness to
            int num = val;
            while (pow >= 0)
            {

                int mag = Convert.ToInt32(Math.Pow(bitness,  pow));
                int div = num / mag;
                retVal.Add(div);
                num = num - (div * mag);
                pow--;
            }

            return retVal;
        }

        private string CompressStrokeLeg(int[] val)
        {
            StringBuilder sb = new StringBuilder();

            char polarity = PLUS;

            foreach (int num in val)
            {
                //Put the number into base30 format
                List<int> cell = ToBase30(Math.Abs(num));

                //If the polarity has changed, then we need to lay down a polarity indicator
                char newpolarity;
                if (num == 0) newpolarity = polarity;  //Zero indicates no change in polarity
                else newpolarity = (num >= 0) ? PLUS : MINUS;
                if (newpolarity != polarity)
                {
                    sb.Append(newpolarity);
                    polarity = newpolarity;
                }

                //Now convert into the jSignature Base30 compressed format
                for (int i = 0; i < cell.Count; i++)
                {
                    //The first "bitness" characters in the character set are used for the first member of the 
                    //number representation.  If the number representation has more than 1 character, the 
                    //offset in the character set is shifted by "bitness"
                    int charsetoffset = (i > 0) ? bitness : 0;
                    sb.Append(ALLCHARS[cell[i] + charsetoffset]);
                }
            }

            return sb.ToString();
        }
        
        public int[] DecompressStrokeLeg(string data)
        {
            List<int> leg = new List<int>();
            List<int> cell = new List<int>();

            int polarity = 1;

            foreach (char c in data)
            {
                if (charmap_tail.ContainsKey(c))
                {
                    // this is a char that indicates continuation of a number that started a earlier number.
                    cell.Add(charmap_tail[c]);
                }
                else
                {
                    // This is a start of new number (or, in case of + or - an end of previous number)
                    // We can now convert the parts we piled up in cell array into an int.
                    if (cell.Count != 0) {
					    // yep, we have some number parts in there.
                        leg.Add(FromBase30(cell) * polarity);
				    }

                    // When i say "we start a new number" I mean it!
                    cell.Clear();
                    if (c == MINUS){
					    polarity = -1;
				    } else if (c == PLUS){
					    polarity = 1;
				    } else {
					    // now, let's start collecting parts for the new number:
                        cell.Add(charmap[c]);
				    }
                }
            }
            // we will alway have one number stuck in cell array because no "new number starts" follows it.
            leg.Add(FromBase30(cell) * polarity);

            return leg.ToArray();
        }

        private int[][] GetStroke(string legX, string legY)
        {
            // Examples of legX, legY: "7UZ32232263353223222333242", "3w546647c9b96646475765444"
            var X = DecompressStrokeLeg(legX);
            var Y = DecompressStrokeLeg(legY);

            int len = X.Length;
            if (len != Y.Length)
            {
                throw new Exception("Coordinate length for Y side of the stroke does not match the coordinate length of X side of the stroke");
            }

            List<int[]> l = new List<int[]>();
            for (int i = 0; i < len; i++)
            {
                l.Add(new int[] {X[i], Y[i]});
            }
            return l.ToArray();
        }

        /// <summary>
        /// Returns a .net-specific array of arrays structure representing a single signature stroke
        /// A compressed string like this one: 
        ///  "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4"
        /// representing this raw signature data: 
        ///  [{'x':[100,101,104,99,104],'y':[50,52,56,50,44]},{'x':[50,51,48],'y':[100,102,98]}]
        /// turns into this .Net-specific structure (of array or arrays of arrays)
        ///  [[[100,50],[1,2],[3,4],[-5,-6],[5,-6]], [[50,100],[1,2],[-3,-4]]]
        /// </summary>
        /// <param name="data">string of data encoded in base30 format. Ex: "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4"</param>
        /// <returns></returns>
        public int[][][] Base30ToNative(string data){
            List<int[][]> ss = new List<int[][]>();

            string[] parts = data.Split('_');
            int len = parts.Length / 2;

            for (int i = 0; i < len; i++)
            {
                ss.Add(GetStroke(
                    parts[i * 2]
                    , parts[i * 2 + 1]
                ));
            }
            return ss.ToArray();
        }

        /// <summary>
        /// Returns a compressed string like this one: 
        ///  "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4"
        /// Originating from a stroke list such as:
        ///  [[[100,50],[1,2],[3,4],[-5,-6],[5,-6]], [[50,100],[1,2],[-3,-4]]]
        /// </summary>
        /// <param name="data">.Net-specific structure (of array or arrays of arrays)</param>
        /// <returns></returns>
        public string NativeToBase30(int[][][] data)
        {
            StringBuilder sb = new StringBuilder();
            List<int> LegX = new List<int>();
            List<int> LegY = new List<int>();
            foreach (int[][] stroke in data)
            {
                LegX.Clear();
                LegY.Clear();
                foreach (int[] line in stroke)
                {
                    if (line.Length != 2) throw new Exception("Invalid coordinate");
                    LegX.Add(line[0]);
                    LegY.Add(line[1]);
                }

                if (sb.Length > 0) sb.Append("_");
                sb.Append(CompressStrokeLeg(LegX.ToArray()));
                sb.Append("_");
                sb.Append(CompressStrokeLeg(LegY.ToArray()));
            }


            return sb.ToString();
        }
    }
}