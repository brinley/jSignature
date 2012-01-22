using System;
using System.Collections.Generic;
using System.Text;

namespace jSignature
{
    public class Coordinate
    {
        public int x;
        public int y;

        public Coordinate(int x, int y)
        {
            this.x = x;
            this.y = y;
        }
    }

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
            bitness = ALLCHARS.Length / 2; // likely will equal 30

            charmap = new Dictionary<char,int>();
            charmap_tail = new Dictionary<char,int>();
            for (int i = 0; i < bitness; i++)
            {
                charmap.Add(ALLCHARS[i], i);
                charmap_tail.Add(ALLCHARS[i+bitness], i);
            }
        }

        public int FromBase30(List<int> data)
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

        public Coordinate[] GetStroke(string legX, string legY)
        {
            // Examples of legX, legY: "7UZ32232263353223222333242", "3w546647c9b96646475765444"

            var X = DecompressStrokeLeg(legX);
            var Y = DecompressStrokeLeg(legY);

            int len = X.Length;
            if (len != Y.Length)
            {
                throw new Exception("Coordinate length for Y side of the stroke does not match the coordinate length of X side of the stroke");
            }

            List<Coordinate> l = new List<Coordinate>();
            for (int i = 0; i < len; i++)
            {
                l.Add(new Coordinate(
                    X[i]
                    , Y[i]
                ));
            }

            return l.ToArray();
        }

        /// <summary>
        /// Converts stringified base30-compressed string with signature data into
        /// .Net-specific Signature object tuned for quick iteration of it
        /// for rendering / use.
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        public Coordinate[][] GetStrokesTree(string data){
            List<Coordinate[]> ss = new List<Coordinate[]>();

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
    }
}
