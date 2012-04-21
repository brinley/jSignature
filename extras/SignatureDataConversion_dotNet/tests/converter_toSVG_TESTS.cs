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
namespace jSignature.tests
{
    using jSignature;

    [TestFixture]
    public class SVGConverterTests : TestBase
    {
        [Test]
        public void id002_ToSVG()
        {
            // [[[100,50],[1,2],[3,4],[-5,-6],[5,-6]], [[50,100],[1,2],[-3,-4]]];
            // [{'x':[100,101,104,99,104],'y':[50,52,56,50,44]},{'x':[50,51,48],'y':[100,102,98]}]
            // "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4"

            // min x, y = 48, 44
            // ToSVG adjusts the image (moves it up and to left) so that empty space is not there.

            //int[][][] shouldbe = new int[][][] { 
            //    new int[][] {
            //        new int[] {100 - 47, 50 - 43}
            //        ,new int[] {1, 2}
            //        ,new int[] {3, 4}
            //        ,new int[] {-5, -6}
            //        ,new int[] {5, -6}
            //    }
            //    , new int[][] {
            //        new int[] {50 - 47, 100 - 43}
            //        ,new int[] {1, 2}
            //        ,new int[] {-3, -4}
            //    }
            //};


            var data = new jSignature.Base30Converter().GetData("3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4");

            string shouldbe = @"<?xml version=""1.0"" encoding=""UTF-8"" standalone=""no""?><svg xmlns=""http://www.w3.org/2000/svg"" version=""1.1"" width=""57"" height=""59""><path style=""fill:none;stroke:#000000;"" d=""M 53 7 l 1 2 3 4 -5 -6 5 -6""/><path style=""fill:none;stroke:#000000;"" d=""M 3 57 l 1 2 -3 -4""/></svg>";
            string actual = jSignature.SVGConverter.ToSVG(data);

            Assert.AreEqual(
                shouldbe
                , actual
            );
        }
    }
}
