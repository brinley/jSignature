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
    public class Base30plusConverter
    {
        /// <summary>
        /// These chars' place numbers correspond to the number they represent.
        /// </summary>
        string ALLCHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX";
	    int bitness;
	    string MINUS = "Z";
        string PLUS = "Y";

        Dictionary<string, int> charmap;
        Dictionary<int, string> charmap_reverse;

        public Base30plusConverter(){
            bitness = ALLCHARS.Length / 2; // likely will equal 30

            charmap = new Dictionary<string,int>();
            charmap_reverse = new Dictionary<int,string>();

            //for(var i = bitness-1; i > -1; i--){
            //    charmap[ALLCHARS[i]] = ALLCHARS[i+bitness];
            //    charmap_reverse[ALLCHARS[i + bitness]] = ALLCHARS[i];
            //}
        }

        public int[] DecompressStrokeLeg(string data)
        {
            List<int> l = new List<int>();

            

            return l.ToArray();
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
