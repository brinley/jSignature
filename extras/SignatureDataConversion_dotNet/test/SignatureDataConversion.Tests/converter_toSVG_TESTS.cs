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

    class PrivateMethodsAccessorForSVGConverter : jSignature.Tools.SVGConverter
    {
        public static string TestSegmentToCurve(int[][] stroke, int positionInStroke, int lineCurveThreshold)
        {
            return segmentToCurve(stroke, positionInStroke, lineCurveThreshold);
        }

        public static string TestLastSegmentToCurve(int[][] stroke, int lineCurveThreshold)
        {
            return lastSegmentToCurve(stroke, lineCurveThreshold);
        }
    }

    [TestFixture]
    public class SVGConverterTests : TestBase
    {
        [Test]
        public void id002_ToSVG_Internal()
        {
            int[][] stroke = new int[][] {
                new int[] {53, 7}
                , new int[] {1, 2}
                , new int[] {3, 4}
                , new int[] {5, -6}
                , new int[] {-5, -6}
            };

            string[] smoothedcurves = new string[] {
                "this will not be looked at"
                , "c 0.02 0.04 0.59 1.39 1 2"
                , "c 0.92 1.37 2.28 4.18 3 4"
                , "c 1.13 -0.28 5 -4.48 5 -6"
                , "c 0 -1.52 -5 -6 -5 -6"
            };

            // NON-smoothed (by way of cranking line-curve-threshold way up.)
            for (int i = 1; i < stroke.Length - 1; i++)
            {
                //System.Diagnostics.Debug.WriteLine("This is elem " + i.ToString());
                Assert.AreEqual(
                    String.Format("l {0} {1}", stroke[i][0], stroke[i][1])
                    , PrivateMethodsAccessorForSVGConverter.TestSegmentToCurve(stroke, i, 1000)
                );
            }
            Assert.AreEqual(
                String.Format("l {0} {1}", stroke[stroke.Length - 1][0], stroke[stroke.Length - 1][1])
                , PrivateMethodsAccessorForSVGConverter.TestLastSegmentToCurve(stroke, 1000)
            );

            // smoothed (by way of lowering line-curve-threshold to 1 pixel).
            for (int i = 1; i < stroke.Length - 1; i++)
            {
                Assert.AreEqual(
                    smoothedcurves[i]
                    , PrivateMethodsAccessorForSVGConverter.TestSegmentToCurve(stroke, i, 1)
                );
            }
            Assert.AreEqual(
                smoothedcurves[stroke.Length - 1]
                , PrivateMethodsAccessorForSVGConverter.TestLastSegmentToCurve(stroke, 1)
            );
        }

        [Test]
        public void id003_ToSVG_External()
        {
            var data = new jSignature.Tools.Base30Converter().Base30ToNative("3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4");

            string actual = jSignature.Tools.SVGConverter.ToSVG(data);

            // System.IO.File.WriteAllText(Common.SOURCE_PATH + "\\samples\\reference_svg_smoothed.svg", actual);

            var sampleFilePath = Path.Combine(Common.SOURCE_PATH, "samples\\reference_svg_smoothed.svg");

            Assert.IsTrue(File.Exists(sampleFilePath), "Sample File not found!");

            string shouldbe = System.IO.File.ReadAllText(sampleFilePath);
            Assert.AreEqual(shouldbe, actual);
        }

    }
}
