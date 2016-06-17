using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using System.Text.RegularExpressions;

using NUnit.Framework;

/*
 * Note about these tests.
 * 
 * The tests are based on NUnit framework. NUnit framework has a separate "runner" that is
 * external to Visual Studio. (Meaning, you don't "F5" it.)
 * 
 * In the folder containing this project you should find a ***.nunit file. When NUnit framework
 * is installed, double-clicking on the file will open it in the NUnit runner. Select individual
 * tests or a branch of tests and "Run"
*/


/* 
 * Test fixture template

    [TestFixture]
    public class TestGroupName : TestBase
    {

        [Test]
        public void NameOfTest()
        {
            Assert.AreEqual(
                true,
                true
                );
        }
    }

*/
namespace jSignature.Tools.Tests
{
    using jSignature.Tools;

    [TestFixture]
    public class Base30ConverterTests : TestBase
    {
        [Test]
        public void id001_decompressleg()
        {
            int[] leg1x = new int[] {236, 233, 231, 229, 226, 224, 222, 216, 213, 210, 205, 202, 200, 198, 195, 193, 191, 189, 186, 183, 180, 178, 174, 172};
            int[] leg1xVectorized = new int[leg1x.Length];
            int last = 0;
            for (int i = 0; i < leg1x.Length; i++)
            {
                leg1xVectorized[i] = leg1x[i] - last;
                last = leg1x[i];
            }

            var c = new jSignature.Tools.Base30Converter();

            Assert.AreEqual(
                leg1xVectorized
                , c.DecompressStrokeLeg("7UZ32232263353223222333242")
            );
        }

        [Test]
        public void id002_DecompressSig()
        {
            // [[[100,50],[1,2],[3,4],[-5,-6],[5,-6]], [[50,100],[1,2],[-3,-4]]];
            // [{'x':[100,101,104,99,104],'y':[50,52,56,50,44]},{'x':[50,51,48],'y':[100,102,98]}]
            // "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4"

            int[][][] shouldbe = new int[][][] { 
                new int[][] {
                    new int[] {100, 50}
                    ,new int[] {1, 2}
                    ,new int[] {3, 4}
                    ,new int[] {-5, -6}
                    ,new int[] {5, -6}
                }
                , new int[][] {
                    new int[] {50, 100}
                    ,new int[] {1, 2}
                    ,new int[] {-3, -4}
                }
            };

            var c = new jSignature.Tools.Base30Converter();

            Assert.AreEqual(
                shouldbe
                , c.Base30ToNative("3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4")
            );
        }

        [Test]
        public void id003_DecompressSigCompressSig()
        {
            //The sample signature will be decompressed and then compression will take place 
            //immediately after that.  The end result should be identical to the input.
            string compressedSig = "4A8865240Z12020020110200Y1442346668865543232010Z14854Y3858a77d65653212001301002544463334324_1TZ243532Ydgeglgb9646Z7ajicob74522000Y114465865a5511016a7c7a5a410Z15463566Y3545541111Z1332653Y1_bS2Z112344200Y25845583464662200Z40000002330Y216333343234_5DZ374331Y3a8667a5110Z34abfbc896Y4885885333Z5351Y233553332_aF_3K";
            Base30Converter bc = new Base30Converter();

            //Perform the decompression
            int[][][] dec = bc.Base30ToNative(compressedSig);

            //Now convert the output back to being compressed
            string comp = bc.NativeToBase30(dec);

            //The orignal input should be the same as our latest result
            Assert.AreEqual(compressedSig, comp);
        }
    }
}
