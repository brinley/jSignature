using NUnit.Common;
using NUnitLite;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace jSignature.Tools.Tests
{
    public class Program
    {
        public static int Main(string[] args)
        {
            var res = new AutoRun(typeof(Program).GetTypeInfo().Assembly).Execute(args, new ExtendedTextWrapper(Console.Out), Console.In);

            Console.WriteLine("\n\nPress any key...");
            Console.ReadKey();
            return res;
        }
    }
}
